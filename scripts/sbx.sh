#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT="$(basename "$REPO_ROOT")"
MOUNT_NAME="${PROJECT}-mount"
CLONE_NAME="${PROJECT}-clone"
DEV_PORT=3000
IMAGE_TAG="${PROJECT}-sbx:latest"
SBX_DIR="$REPO_ROOT/.sbx"
PNPM_VERSION="$(node -p "require('$REPO_ROOT/package.json').packageManager.split('@')[1].split('+')[0]" 2>/dev/null || echo latest)"
# Dedicated, signing-only SSH key (see docs/claude-sandboxes.md). Not an auth/push key.
SIGNING_KEY="${SBX_SIGNING_KEY:-$HOME/.ssh/sbx_signing}"

require_sbx() {
    if ! command -v sbx >/dev/null 2>&1; then
        echo "Docker Sandboxes not installed — run 'brew install sbx' to use the AI sandboxes." >&2
        exit 0
    fi
}

require_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker is required to build the sandbox image — install Docker Desktop." >&2
        exit 1
    fi
}

sandbox_exists() {
    sbx ls -q 2>/dev/null | grep -qx "$1"
}

template_exists() {
    sbx template ls 2>/dev/null | grep -q "${PROJECT}-sbx"
}

default_branch() {
    local branch
    branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
    echo "${branch:-master}"
}

dhis2_host() {
    node -e "try{const u=require('$REPO_ROOT/cypress.env.json').dhis2BaseUrl;process.stdout.write(u?new URL(u).host:'')}catch(e){}" 2>/dev/null
}

# Hosts the sandbox is allowed to reach. Chromium is baked into the image, so no
# playwright CDN is needed at runtime. GitHub + Sonar are read-only from the sandbox.
allowed_hosts() {
    local hosts="mcp.grep.app,context7.com,*.context7.com,download.cypress.io,cdn.cypress.io"
    hosts="${hosts},dhis2.org,*.dhis2.org,api.github.com,github.com,codeload.github.com"
    hosts="${hosts},sonarcloud.io,api.sonarcloud.io"
    local dhis
    dhis="$(dhis2_host)"
    [ -n "$dhis" ] && hosts="${hosts},${dhis}"
    echo "$hosts"
}

configure_policy() {
    local name="$1"
    echo "Configuring network policy for '$name'..."
    sbx policy allow network --sandbox "$name" "$(allowed_hosts)" >/dev/null
}

# Accept the project trust dialog non-interactively so Claude starts without prompting.
accept_trust() {
    local name="$1"
    sbx exec "$name" bash -lc '
        f="/home/agent/.claude.json"
        node -e "
            const fs=require(\"fs\"),p=\"$1\",f=\"$f\";
            let c={};try{c=JSON.parse(fs.readFileSync(f,\"utf8\"))}catch(e){}
            c.projects=c.projects||{};c.projects[p]=c.projects[p]||{};
            c.projects[p].hasTrustDialogAccepted=true;
            fs.writeFileSync(f,JSON.stringify(c,null,2));
        "
    ' _ "$REPO_ROOT"
}

# Build the custom sandbox image and load it into the sbx runtime. The sbx runtime has
# its own image store, so bridge the host docker image across via save + template load.
build_image() {
    require_docker
    echo "Building custom sandbox image '$IMAGE_TAG' (a few minutes)..."
    docker build --build-arg "PNPM_VERSION=$PNPM_VERSION" -t "$IMAGE_TAG" -f "$SBX_DIR/Dockerfile" "$SBX_DIR"
    local tar
    tar="$(mktemp -t sbx-img)"
    echo "Loading the image into the sandbox runtime..."
    docker save "$IMAGE_TAG" -o "$tar"
    sbx template load "$tar"
    rm -f "$tar"
}

ensure_image() {
    if ! template_exists; then
        echo "Sandbox image not loaded yet — building it now."
        build_image
    fi
}

read_secret() {
    local prompt="$1" var
    printf '%s' "$prompt" >&2
    read -rs var || var=""
    echo >&2
    printf '%s' "$var"
}

compose_note() {
    cat "$SBX_DIR/base.md"
    echo
    cat "$SBX_DIR/$1"
}

read -r -d '' IDE_FORWARDER_JS <<'JSEOF' || true
const net = require('net')

// Forward sandbox 127.0.0.1:<port> to the host editor's loopback WS at the same
// port. The sandbox reaches the host only through its egress proxy, so tunnel via
// HTTP CONNECT to host.docker.internal (which the proxy maps to the host loopback).
const port = parseInt(process.argv[2], 10)
const proxyUrl =
    process.env.https_proxy || process.env.HTTPS_PROXY || 'http://gateway.docker.internal:3128'
const proxy = new URL(proxyUrl)
const proxyHost = proxy.hostname || 'gateway.docker.internal'
const proxyPort = parseInt(proxy.port, 10) || 3128
const target = `host.docker.internal:${port}`

function handle(client) {
    const upstream = net.connect(proxyPort, proxyHost)
    let header = Buffer.alloc(0)
    let tunneled = false

    const onHeader = (chunk) => {
        header = Buffer.concat([header, chunk])
        const end = header.indexOf('\r\n\r\n')
        if (end === -1) return
        const status = header.slice(0, header.indexOf('\r\n')).toString()
        if (!status.includes(' 200 ')) {
            client.destroy()
            upstream.destroy()
            return
        }
        tunneled = true
        upstream.removeListener('data', onHeader)
        const rest = header.slice(end + 4) // bytes after the CONNECT response are tunnel data
        if (rest.length) client.write(rest)
        client.pipe(upstream)
        upstream.pipe(client)
    }

    upstream.on('connect', () => {
        upstream.write(`CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`)
        upstream.on('data', onHeader)
    })
    const cleanup = () => {
        client.destroy()
        upstream.destroy()
    }
    client.on('error', cleanup)
    upstream.on('error', cleanup)
    client.on('close', () => {
        if (!tunneled) upstream.destroy()
    })
}

const server = net.createServer(handle)
server.on('error', (e) => {
    process.stderr.write(String(e) + '\n')
    process.exit(1)
})
server.listen(port, '127.0.0.1')
JSEOF

maybe_inject_dhis2_creds() {
    local name="$1"
    [ -f "$REPO_ROOT/cypress.env.json" ] || return 0
    printf 'Inject cypress.env.json (DHIS2 test creds) into the clone for e2e? [y/N] '
    local reply
    read -r reply || reply=""
    case "$reply" in
        [yY]*)
            sbx cp "$REPO_ROOT/cypress.env.json" "${name}:${REPO_ROOT}/cypress.env.json"
            echo "Copied cypress.env.json into the clone."
            ;;
        *) echo "Skipped DHIS2 creds." ;;
    esac
}

# Run a command, killing it and returning 124 if it exceeds <secs>. Output suppressed.
# macOS has no `timeout`, so this is a portable stand-in. Polls at 0.2s so a fast command
# returns promptly (a 1s poll added ~1s of latency to every bounded call).
run_with_timeout() {
    local secs="$1"; shift
    "$@" >/dev/null 2>&1 &
    local pid=$! i=0 max=$((secs * 5))
    while kill -0 "$pid" 2>/dev/null; do
        if [ "$i" -ge "$max" ]; then
            kill -TERM "$pid" 2>/dev/null
            wait "$pid" 2>/dev/null
            return 124
        fi
        sleep 0.2
        i=$((i + 1))
    done
    wait "$pid" 2>/dev/null
}

# Retry a command up to <attempts> times, each bounded by <secs>. Returns 0 on the
# first success, 1 if all attempts fail or time out. Never hangs.
retry() {
    local attempts="$1" secs="$2"; shift 2
    local n=1
    while [ "$n" -le "$attempts" ]; do
        if run_with_timeout "$secs" "$@"; then return 0; fi
        n=$((n + 1))
    done
    return 1
}

# Print an editor-integration message and pause so it's readable — Claude's TUI clears
# the terminal as soon as it starts, which otherwise hides these notices.
ide_msg() {
    echo "$1"
    sleep 3
}

session_dir() {
    printf '%s/.claude/projects/%s' "$HOME" "$(printf '%s' "$REPO_ROOT" | sed 's#/#-#g')"
}

ide_dir() {
    printf '%s/.claude/ide' "$HOME"
}

# Symlink the RW-mounted host session dir (history + memory) into the sandbox home,
# where Claude looks for it — host and sandbox homes differ. Bounded + retried.
link_host_dirs() {
    local name="$1" sdir
    sdir="$(session_dir)"
    [ -d "$sdir" ] || return 0
    if retry 2 12 sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude/projects"; ln -sfn "$1" "$HOME/.claude/projects/$(basename "$1")"' _ "$sdir"; then
        echo "Linked session history + memory (two-way)."
    else
        echo "⚠ Couldn't link session history (sbx not responding) — continuing without it."
    fi
}

# Ports of live (reachable) editor locks whose workspace is this repo. Reads the
# host lock dir directly; only returns ports something is actually listening on,
# so stale locks (dead Neovim sessions) are skipped.
live_ide_ports() {
    local d ports port
    d="$(ide_dir)"
    [ -d "$d" ] || return 0
    ports="$(node -e '
        const fs = require("fs"), path = require("path");
        const dir = process.argv[1], repo = process.argv[2], out = [];
        try {
            for (const f of fs.readdirSync(dir)) {
                if (!f.endsWith(".lock")) continue;
                let o;
                try { o = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { continue; }
                if ((o.workspaceFolders || []).includes(repo)) out.push(path.basename(f, ".lock"));
            }
        } catch (e) {}
        process.stdout.write(out.join(" "));
    ' "$d" "$REPO_ROOT")"
    for port in $ports; do
        nc -z 127.0.0.1 "$port" 2>/dev/null && echo "$port"
    done
}

# Editor integration for /ide (mount only). Symlinks the (mounted) host lock dir into
# the sandbox home so /ide sees live locks, then for each live Neovim port for this repo
# opens a scoped network rule and starts a loopback->host forwarder. Every step is bounded
# + retried; on failure it prints a notice and continues — it never hangs or errors, so a
# flaky sbx call can't block the mount. Re-run mount if you (re)start Neovim.
ide_link() {
    local name="$1" ports port fwd_b64
    ports="$(live_ide_ports)"
    if [ -z "$ports" ]; then
        [ -d "$(ide_dir)" ] && retry 2 12 sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude"; rm -rf "$HOME/.claude/ide"; ln -sfn "$1" "$HOME/.claude/ide"' _ "$(ide_dir)"
        ide_msg "Editor integration: no live Neovim for this repo — /ide will be empty (start Neovim, then re-run mount)."
        return 0
    fi
    fwd_b64="$(printf '%s' "$IDE_FORWARDER_JS" | base64 | tr -d '\n')"
    if ! retry 2 12 sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude"; rm -rf "$HOME/.claude/ide"; ln -sfn "$1" "$HOME/.claude/ide"; printf "%s" "$2" | base64 -d > /home/agent/sbx-ide-forward.js' _ "$(ide_dir)" "$fwd_b64"; then
        ide_msg "⚠ Editor integration: couldn't reach the sandbox — /ide won't connect. Sandbox is otherwise fine."
        return 0
    fi
    for port in $ports; do
        retry 2 12 sbx policy allow network --sandbox "$name" "localhost:${port},host.docker.internal" || true
        # `sbx exec -d` starts the detached forwarder within ~1-2s but then blocks ~30s+ on its
        # own inspect (and ignores TERM) before exiting. Fire it and DON'T wait — the orphaned
        # client finishes its inspect harmlessly while the verify below confirms it's listening.
        ( sbx exec -d "$name" node /home/agent/sbx-ide-forward.js "$port" >/dev/null 2>&1 & )
        if run_with_timeout 12 sbx exec "$name" bash -lc 'for _ in $(seq 1 20); do exec 3<>/dev/tcp/127.0.0.1/'"$port"' 2>/dev/null && exit 0; sleep 0.3; done; exit 1'; then
            echo "  Host editor linked on port $port. If Claude doesn't auto-connect, run /ide in the session to connect."
        else
            echo "  ⚠ Editor integration: forwarder for port $port isn't listening — /ide won't connect."
        fi
    done
    sleep 3   # keep: let the connection-outcome message stay readable before Claude's TUI clears it
}

# Overlay the bind-mounted node_modules with a container-local copy and install the
# Linux-native dependencies into it. Only needed on macOS: the host's node_modules holds
# macOS-native binaries the Linux sandbox can't run, so it's shadowed by a container-local
# dir the host never sees. On a Linux host the bind-mounted node_modules is already the
# right OS/arch, so this is skipped and the live bind mount is used directly. The overlay
# is re-applied on every mount (a sudo bind mount doesn't survive a restart); the install
# runs only when the overlay is empty or the lockfile changed.
node_modules_overlay() {
    local name="$1"
    [ "$(uname)" = "Darwin" ] || return 0
    echo "Setting up container-local node_modules and installing dependencies (first run only, a few minutes)..."
    if sbx exec "$name" bash -lc '
        set -e
        repo="$1"; nm=/home/agent/nm
        mkdir -p "$nm"
        if ! mountpoint -q "$repo/node_modules"; then
            mkdir -p "$repo/node_modules"
            sudo mount --bind "$nm" "$repo/node_modules"
        fi
        if [ ! -e "$nm/.installed" ] || [ "$repo/pnpm-lock.yaml" -nt "$nm/.installed" ]; then
            cd "$repo" && HUSKY=0 pnpm install && touch "$nm/.installed"
        fi
    ' _ "$REPO_ROOT"; then
        echo "Dependencies installed in a container-local node_modules (host node_modules untouched)."
    else
        echo "⚠ Couldn't set up node_modules — the agent can retry with: pnpm install"
    fi
}

# One-way copy of this project's memory into a sandbox (no sessions, no settings).
# Used for the isolated clone; re-run on demand via "sync-clone".
copy_memory() {
    local name="$1" projdir memsrc
    projdir="$(basename "$(session_dir)")"
    memsrc="$(session_dir)/memory"
    [ -d "$memsrc" ] || { echo "No project memory to copy into '$name'."; return 0; }
    echo "Copying project memory into '$name'..."
    sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude/projects/$1"' _ "$projdir"
    sbx cp "$memsrc" "${name}:/home/agent/.claude/projects/${projdir}/"
}

# Configure signed commits in the clone using the dedicated (signing-only) SSH key.
# The key is copied in because git signs locally; it grants no push/auth ability, so a
# leak only lets someone produce commits that appear authored by the key — see the docs.
setup_signing() {
    local name="$1" gname gmail
    gname="$(git config user.name || true)"
    gmail="$(git config user.email || true)"
    sbx cp "$SIGNING_KEY" "${name}:/home/agent/.ssh/sbx_signing"
    sbx cp "${SIGNING_KEY}.pub" "${name}:/home/agent/.ssh/sbx_signing.pub"
    sbx exec "$name" bash -lc '
        set -e
        chmod 700 "$HOME/.ssh"; chmod 600 "$HOME/.ssh/sbx_signing"; chmod 644 "$HOME/.ssh/sbx_signing.pub"
        git config --global gpg.format ssh
        git config --global user.signingkey "$HOME/.ssh/sbx_signing.pub"
        git config --global commit.gpgsign true
        [ -n "$1" ] && git config --global user.name "$1"
        [ -n "$2" ] && git config --global user.email "$2"
        true
    ' _ "$gname" "$gmail"
    echo "Signed commits configured in '$name'."
}

cmd_mount() {
    require_sbx
    # pnpm forwards its "--" separator through to us; drop it so it doesn't reach Claude.
    if [ "${1:-}" = "--" ]; then shift; fi
    if ! sandbox_exists "$MOUNT_NAME"; then
        ensure_image
        echo "Creating mount sandbox '$MOUNT_NAME'..."
        local extra=()
        if [ -d "$(session_dir)" ]; then extra+=("$(session_dir)"); fi
        # Editor-lock dir is mounted READ-ONLY: the sandbox only reads locks to discover
        # Neovim; a RW mount let the sandbox's failed connect delete the host's lock.
        if [ -d "$(ide_dir)" ]; then extra+=("$(ide_dir):ro"); fi
        sbx create -t "$IMAGE_TAG" claude "$REPO_ROOT" ${extra[@]+"${extra[@]}"} --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
        configure_policy "$MOUNT_NAME"
        accept_trust "$MOUNT_NAME"
        link_host_dirs "$MOUNT_NAME"
    fi
    ide_link "$MOUNT_NAME"
    node_modules_overlay "$MOUNT_NAME"
    local note
    note="$(compose_note mount.md)"
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "$note" \
        "$@"
}

cmd_clone() {
    require_sbx
    # pnpm forwards its "--" separator through to us; drop it so it doesn't reach Claude.
    if [ "${1:-}" = "--" ]; then shift; fi
    if ! sandbox_exists "$CLONE_NAME"; then
        ensure_image
        echo "Creating clone sandbox '$CLONE_NAME'..."
        sbx create --clone -t "$IMAGE_TAG" claude "$REPO_ROOT" --name "$CLONE_NAME"
        # The clone inherits the host's SSH origin, which needs a key the sandbox lacks.
        # Point it at HTTPS so the agent can fetch/pull the (public) repo with no credentials.
        # Pushing still fails (no push creds), which is intended.
        sbx exec "$CLONE_NAME" bash -lc 'cd "$1" && git remote set-url origin "$(git remote get-url origin | sed -E "s#git@github.com:#https://github.com/#")"' _ "$REPO_ROOT" || true
        # Disable git hooks in the clone: the per-edit format hook and the "run pnpm
        # test/lint before finishing" instruction already cover lint/types/tests, and the
        # clone never pushes (pre-push never fires). HUSKY=0 skips all three (.hooks/pre-commit).
        sbx exec "$CLONE_NAME" bash -lc 'sudo sed -i "/export HUSKY=/d" /etc/sandbox-persistent.sh; printf "export HUSKY=0\n" | sudo tee -a /etc/sandbox-persistent.sh >/dev/null' || true
        configure_policy "$CLONE_NAME"
        accept_trust "$CLONE_NAME"
        setup_signing "$CLONE_NAME"
        echo "Installing dependencies in the clone (generate-types hits the DHIS2 instance; includes the Cypress binary)..."
        sbx exec "$CLONE_NAME" bash -lc 'cd "$1" && pnpm install' _ "$REPO_ROOT" \
            || echo "⚠ Dependency install failed — the agent can retry with: pnpm install"
        copy_memory "$CLONE_NAME"
        maybe_inject_dhis2_creds "$CLONE_NAME"
    fi
    local note
    note="$(compose_note clone.md)"
    sbx run "$CLONE_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "$note" \
        "$@"
    echo
    echo "Retrieve the clone's commits on the host with:"
    echo "  git fetch sandbox-${CLONE_NAME}"
    echo "  git log sandbox-${CLONE_NAME}/<branch>"
}

cmd_sync_clone() {
    require_sbx
    if ! sandbox_exists "$CLONE_NAME"; then
        echo "No clone sandbox '$CLONE_NAME' — run 'pnpm sbx:clone' first." >&2
        exit 1
    fi
    copy_memory "$CLONE_NAME"
}

cmd_reset_clone() {
    require_sbx
    if ! sandbox_exists "$CLONE_NAME"; then
        echo "No clone sandbox '$CLONE_NAME' to reset." >&2
        exit 1
    fi
    local branch
    branch="$(default_branch)"
    sbx exec "$CLONE_NAME" bash -lc "git reset --hard origin/${branch} && git clean -fdx"
}

# Reinstall the mount's container-local node_modules from the current lockfile.
# Use after changing dependencies; a fresh mount picks up lockfile changes on its own.
cmd_refresh_deps() {
    require_sbx
    if ! sandbox_exists "$MOUNT_NAME"; then
        echo "No mount sandbox '$MOUNT_NAME' — run 'pnpm sbx:mount' first." >&2
        exit 1
    fi
    echo "Reinstalling container-local node_modules..."
    sbx exec "$MOUNT_NAME" bash -lc '
        set -e
        repo="$1"; nm=/home/agent/nm
        mountpoint -q "$repo/node_modules" || { mkdir -p "$nm" "$repo/node_modules"; sudo mount --bind "$nm" "$repo/node_modules"; }
        cd "$repo" && HUSKY=0 pnpm install && touch "$nm/.installed"
        echo "Refreshed."
    ' _ "$REPO_ROOT"
}

cmd_purge() {
    require_sbx
    sbx rm --force "$MOUNT_NAME" "$CLONE_NAME" || true
}

cmd_rebuild() {
    require_sbx
    build_image
    echo "Image rebuilt. Recreate sandboxes ('pnpm sbx:purge' then mount/clone) to pick it up."
}

cmd_setup() {
    require_sbx
    require_docker
    sbx login
    if ! sbx policy set-default balanced 2>/dev/null; then
        echo "Network policy already set — keeping it. (To change: sbx policy reset, then re-run setup.)"
    fi

    build_image

    printf 'Store an Anthropic API key? Subscription users skip this and sign in via OAuth on first mount. [y/N] '
    local areply
    read -r areply || areply=""
    case "$areply" in
        [yY]*) sbx secret set -g anthropic ;;
        *) echo "Skipping — Claude will prompt for interactive OAuth login on first 'pnpm sbx:mount'." ;;
    esac

    # GitHub read-only token (required). Injected as a placeholder GH_TOKEN; the proxy swaps
    # in the real token on outbound GitHub requests, so it never enters the sandbox. A
    # read-only fine-grained PAT means gh works for reads and writes fail server-side.
    local pat
    pat="$(read_secret 'GitHub read-only fine-grained PAT (required; see docs/claude-sandboxes.md): ')"
    if [ -z "$pat" ]; then
        echo "No PAT entered. A read-only PAT is required — see docs/claude-sandboxes.md, then re-run setup." >&2
        exit 1
    fi
    sbx secret set-custom -g --host api.github.com --host github.com --host codeload.github.com \
        --env GH_TOKEN --placeholder 'ghp_{rand}' --value "$pat"
    echo "GitHub token stored (read-only; proxy-injected, never exposed inside the sandbox)."

    # Signing key (required). Verified here; wired into each clone at creation.
    if [ ! -f "$SIGNING_KEY" ] || [ ! -f "${SIGNING_KEY}.pub" ]; then
        echo "Signing key not found at '$SIGNING_KEY'(.pub). Create a dedicated signing key:" >&2
        echo "  ssh-keygen -t ed25519 -f '$SIGNING_KEY' -C 'sbx signing'" >&2
        echo "then add the .pub as a *Signing Key* on GitHub. See docs/claude-sandboxes.md." >&2
        exit 1
    fi
    echo "Signing key found at '$SIGNING_KEY'."

    printf 'Configure an optional context7 API key (higher rate limits)? [y/N] '
    local reply
    read -r reply || reply=""
    case "$reply" in
        [yY]*)
            local key
            key="$(read_secret 'context7 API key: ')"
            if [ -n "$key" ]; then
                sbx secret set-custom -g --host context7.com --env CONTEXT7_API_KEY --value "$key"
                echo "context7 key stored (proxy-injected; never exposed inside the sandbox)."
            else
                echo "No key entered — skipping."
            fi
            ;;
        *) echo "Skipped context7 key (works keyless at a lower rate limit)." ;;
    esac

    # SonarCloud token (optional): public DHIS2 projects read anonymously; a token only
    # raises limits. Proxy-injected as a placeholder, never exposed inside the sandbox.
    if [ -n "${SONAR_TOKEN:-}" ]; then
        sbx secret set-custom -g --host sonarcloud.io --host api.sonarcloud.io \
            --env SONAR_TOKEN --placeholder 'sqp_{rand}' --value "$SONAR_TOKEN"
        echo "SonarCloud token stored from the host SONAR_TOKEN (proxy-injected)."
    fi

    echo "Setup complete. Run 'pnpm sbx:mount' or 'pnpm sbx:clone'."
}

case "${1:-}" in
    mount)        cmd_mount "${@:2}" ;;
    clone)        cmd_clone "${@:2}" ;;
    sync-clone)   cmd_sync_clone ;;
    reset-clone)  cmd_reset_clone ;;
    refresh-deps) cmd_refresh_deps ;;
    rebuild)      cmd_rebuild ;;
    purge)        cmd_purge ;;
    setup)        cmd_setup ;;
    *)
        echo "Usage: scripts/sbx.sh {setup|mount|clone|sync-clone|reset-clone|refresh-deps|rebuild|purge}" >&2
        exit 1
        ;;
esac
