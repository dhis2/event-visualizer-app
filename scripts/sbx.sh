#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT="$(basename "$REPO_ROOT")"
MOUNT_NAME="${PROJECT}-mount"
CLONE_NAME="${PROJECT}-clone"
DEV_PORT=3000
MARKETPLACE="anthropics/claude-plugins-official"
PNPM_VERSION="$(node -p "require('$REPO_ROOT/package.json').packageManager.split('@')[1].split('+')[0]" 2>/dev/null || echo latest)"

# The committed .claude/settings.json enables the chrome-devtools-mcp plugin, which on the host
# drives the host's own Chrome. The sandbox has no such Chrome — browser automation is provided
# instead by a sandbox-local headless server (see setup_browser). Disable the plugin
# per-run via --settings (CLI scope wins over project settings) so it does not error as "enabled
# but not installed", without writing to the bind-mounted repo (which would disable it for the host).
DISABLE_HOST_CHROME_PLUGIN='{"enabledPlugins":{"chrome-devtools-mcp@claude-plugins-official":false}}'

require_sbx() {
    if ! command -v sbx >/dev/null 2>&1; then
        echo "Docker Sandboxes not installed — run 'brew install sbx' to use the AI sandboxes." >&2
        exit 0
    fi
}

sandbox_exists() {
    sbx ls -q 2>/dev/null | grep -qx "$1"
}

default_branch() {
    local branch
    branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
    echo "${branch:-master}"
}

dhis2_host() {
    node -e "try{const u=require('$REPO_ROOT/cypress.env.json').dhis2BaseUrl;process.stdout.write(u?new URL(u).host:'')}catch(e){}" 2>/dev/null
}

provision_sandbox() {
    local name="$1"
    # download/cdn.cypress.io: reachable so Cypress can be installed on demand (the default
    # install still skips it via CYPRESS_INSTALL_BINARY=0; see below). dhis2.org + *.dhis2.org:
    # general DHIS2 access (docs, play/test instances) beyond the specific cypress.env host.
    local hosts="mcp.grep.app,context7.com,*.context7.com,download.cypress.io,cdn.cypress.io,dhis2.org,*.dhis2.org"
    local dhis
    dhis="$(dhis2_host)"
    [ -n "$dhis" ] && hosts="${hosts},${dhis}"
    echo "Configuring network policy for '$name'..."
    sbx policy allow network --sandbox "$name" "$hosts" >/dev/null
    echo "Provisioning '$name' (pnpm + language server + plugins; first run only, takes a minute)..."
    sbx exec "$name" bash -lc '
        set -e
        # typescript-language-server is the binary the typescript-lsp plugin shells out to; it is
        # not part of the project node_modules, so install it (plus a fallback tsserver) globally.
        sudo npm i -g "pnpm@$1" typescript-language-server typescript >/dev/null 2>&1
        claude plugin marketplace add "$2" >/dev/null
        claude plugin install typescript-lsp@claude-plugins-official >/dev/null
        claude plugin install context7@claude-plugins-official >/dev/null
        claude plugin install superpowers@claude-plugins-official >/dev/null
        # Cypress/Electron e2e needs GTK + X libs to actually run (the binary itself installs
        # from the allow-listed CDN during pnpm install). Best-effort; wait out startup apt lock.
        for _ in $(seq 1 30); do sudo fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || break; sleep 2; done
        sudo apt-get install -y libgtk-3-0t64 libgtk2.0-0t64 libgbm1 libnotify4 libnss3 libxss1 libasound2t64 libxtst6 xauth xvfb >/dev/null 2>&1 || true
    ' _ "$PNPM_VERSION" "$MARKETPLACE"
}

read -r -d '' BASE_NOTE <<'EOF' || true
You are running inside an isolated Docker Sandboxes microVM with its own filesystem, network, and Docker daemon.
You have passwordless sudo. Install OS packages with `sudo apt-get install ...` — they persist for the sandbox's lifetime. Install home-directory or user-level tools WITHOUT sudo, or they install under /root/ and will not be on your PATH.
Outbound network is restricted by a "balanced" policy. Permission prompts are skipped because of this isolation, not because the environment is unconditionally safe — still avoid destructive or data-exfiltrating actions.
EOF

read -r -d '' MOUNT_NOTE <<'EOF' || true
These are the human's LIVE working files, bind-mounted from the host; your edits appear immediately in their editor.
Dependencies are already installed: the host install includes the Linux binaries, and node_modules is overlaid with a fast native-filesystem copy. DO NOT run `pnpm install` — it is not needed, and the network policy blocks the Cypress binary download so the install would fail. Run tests/build directly (`pnpm test`, `pnpm lint`, `pnpm start`).
DO NOT branch or commit — the human reviews your diffs and commits on the host.
A dev server you start (e.g. `pnpm start`) is reachable from the host at http://localhost:3000.
Browser automation is available: the chrome-devtools tools drive an in-sandbox headless Chrome. Use them to load and inspect your running app — start the dev server, then navigate to http://localhost:3000.
EOF

read -r -d '' CLONE_NOTE <<'EOF' || true
This OVERRIDES the project CLAUDE.md "do not commit" rule. That rule protects the human's live working tree and does not apply here — you are on a private, isolated clone of the repository.
Work autonomously: create a clearly-named feature branch, run `pnpm test` and `pnpm lint`, and commit your progress to it as you go.
Git hooks are disabled here. As the last step before you're done, run `pnpm d2-app-scripts i18n extract` and commit any resulting `i18n/` changes (the pre-commit hook normally does this on every commit; here it only needs to be correct in your final commit).
Git reads are fine: you CAN `git fetch`/`git pull` from `origin` (GitHub, public repo, no credentials) — e.g. `git fetch origin master` to branch off the latest master. You must NOT push: pushing to forge remotes is off-limits (and there are no push credentials).
How your work reaches the human: this sandbox also publishes its repository back to the host over a read-only git remote, and the human fetches your branch from it to review — so committing to your feature branch is all that is needed.
Dependencies are already installed, including the Cypress binary (the e2e CDN is allow-listed).
Browser automation is available: the chrome-devtools tools drive an in-sandbox headless Chrome. Start the dev server (`pnpm start`) and navigate to http://localhost:3000 to load and inspect the app.
A read-only copy of the host's working tree is also at /run/sandbox/source for any UNPUSHED local changes; pull them with `git pull /run/sandbox/source <branch>`.
EOF

read -r -d '' IDE_FORWARDER_PY <<'PYEOF' || true
import sys, os, socket, threading
from urllib.parse import urlparse

# Forward sandbox 127.0.0.1:<port> to the host editor's loopback WS at the same
# port. The sandbox reaches the host only through its egress proxy, so tunnel via
# HTTP CONNECT to host.docker.internal (which the proxy maps to the host loopback).
port = int(sys.argv[1])
proxy_url = (os.environ.get("https_proxy") or os.environ.get("HTTPS_PROXY")
             or "http://gateway.docker.internal:3128")
parsed = urlparse(proxy_url)
proxy_host = parsed.hostname or "gateway.docker.internal"
proxy_port = parsed.port or 3128
target = "host.docker.internal:%d" % port

def connect_upstream():
    s = socket.create_connection((proxy_host, proxy_port), timeout=10)
    s.sendall(("CONNECT %s HTTP/1.1\r\nHost: %s\r\n\r\n" % (target, target)).encode())
    header = b""
    while b"\r\n\r\n" not in header:
        chunk = s.recv(1)
        if not chunk:
            s.close()
            return None
        header += chunk
    if b" 200 " not in header.split(b"\r\n", 1)[0]:
        s.close()
        return None
    return s

def pipe(src, dst):
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except OSError:
        pass
    finally:
        for s in (src, dst):
            try:
                s.close()
            except OSError:
                pass

def handle(client):
    upstream = connect_upstream()
    if upstream is None:
        client.close()
        return
    threading.Thread(target=pipe, args=(client, upstream), daemon=True).start()
    threading.Thread(target=pipe, args=(upstream, client), daemon=True).start()

listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
listener.bind(("127.0.0.1", port))
listener.listen(64)
while True:
    conn, _ = listener.accept()
    threading.Thread(target=handle, args=(conn,), daemon=True).start()
PYEOF

maybe_inject_dhis2_creds() {
    local name="$1"
    [ -f "$REPO_ROOT/cypress.env.json" ] || return 0
    printf 'Inject cypress.env.json (DHIS2 test creds) into the clone for e2e? [y/N] '
    local reply
    read -r reply || reply=""
    case "$reply" in
        [yY]*)
            # The clone is checked out at the host path ($REPO_ROOT) inside the container.
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

# Editor integration for /ide. Symlinks the (mounted) host lock dir into the sandbox
# home so /ide sees live locks, then for each live Neovim port for this repo opens a
# scoped network rule and starts a loopback->host forwarder. Every step is bounded +
# retried; on failure it prints a notice and continues — it never hangs or errors, so
# a flaky sbx call can't block the mount. Re-run mount if you (re)start Neovim.
ide_link() {
    local name="$1" ports port fwd_b64
    ports="$(live_ide_ports)"
    if [ -z "$ports" ]; then
        # No live editor — still link the lock dir so /ide works if one starts mid-session.
        [ -d "$(ide_dir)" ] && retry 2 12 sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude"; rm -rf "$HOME/.claude/ide"; ln -sfn "$1" "$HOME/.claude/ide"' _ "$(ide_dir)"
        ide_msg "Editor integration: no live Neovim for this repo — /ide will be empty (start Neovim, then re-run mount)."
        return 0
    fi
    # One round-trip: symlink the lock dir AND write the forwarder. The forwarder is written
    # in-sandbox (base64) rather than `sbx cp`'d, so it is owned by the agent and readable —
    # no chmod dance, one fewer round-trip.
    fwd_b64="$(printf '%s' "$IDE_FORWARDER_PY" | base64 | tr -d '\n')"
    if ! retry 2 12 sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude"; rm -rf "$HOME/.claude/ide"; ln -sfn "$1" "$HOME/.claude/ide"; printf "%s" "$2" | base64 -d > /home/agent/sbx-ide-forward.py' _ "$(ide_dir)" "$fwd_b64"; then
        ide_msg "⚠ Editor integration: couldn't reach the sandbox — /ide won't connect. Sandbox is otherwise fine."
        return 0
    fi
    for port in $ports; do
        retry 2 12 sbx policy allow network --sandbox "$name" "localhost:${port},host.docker.internal" || true
        # `sbx exec -d` starts the detached forwarder within ~1-2s but then blocks ~30s+ on its
        # own inspect (and ignores TERM, so run_with_timeout can't cap it) before exiting. Fire
        # it and DON'T wait — the orphaned client finishes its inspect harmlessly in the
        # background while the verify below confirms the forwarder is actually listening.
        ( sbx exec -d "$name" python3 /home/agent/sbx-ide-forward.py "$port" >/dev/null 2>&1 & )
        if run_with_timeout 12 sbx exec "$name" bash -lc 'for _ in $(seq 1 20); do exec 3<>/dev/tcp/127.0.0.1/'"$port"' 2>/dev/null && exit 0; sleep 0.3; done; exit 1'; then
            echo "  Host editor linked on port $port. If Claude doesn't auto-connect, run /ide in the session to connect."
        else
            echo "  ⚠ Editor integration: forwarder for port $port isn't listening — /ide won't connect."
        fi
    done
    sleep 3   # keep: let the connection-outcome message stay readable before Claude's TUI clears it
}

# Exit 0 if the native node_modules snapshot exists and is no older than the
# Overlay the bind-mounted node_modules with a copy on the sandbox's native fs.
# Only needed on macOS: the macOS↔Linux file-sharing layer makes the bind mount ~5x slower
# for test/build I/O (every module-resolution stat pays virtualization latency, and vitest
# cold-loads the whole graph incl. jsdom per file). On a Linux host the bind mount is already
# native-speed, so this is skipped there and the live bind mount is used directly.
# The copy is a snapshot, rebuilt when pnpm-lock.yaml changes (or via "refresh-deps").
# Container-local (sudo mount --bind) — the host node_modules is never touched. The
# sudo mount does not survive a sandbox restart, so this re-applies on every mount; on a
# restart the snapshot is reused, so it is just a remount. The whole decision (already
# mounted? snapshot fresh? copy + mount) runs in one round-trip. Best-effort + bounded:
# on failure tests still run, just slowly off the bind mount.
native_node_modules() {
    local name="$1"
    [ "$(uname)" = "Darwin" ] || return 0
    if run_with_timeout 360 sbx exec "$name" bash -lc '
        set -e
        repo="$1"; nm=/home/agent/nm
        if mountpoint -q "$repo/node_modules"; then exit 0; fi
        if [ ! -d "$nm" ] || [ "$repo/pnpm-lock.yaml" -nt "$nm" ]; then
            rm -rf "$nm" && cp -a "$repo/node_modules" "$nm" && touch "$nm"
        fi
        sudo mount --bind "$nm" "$repo/node_modules"
    ' _ "$REPO_ROOT"; then
        echo "Native node_modules overlay active (host node_modules untouched)."
    else
        echo "⚠ Couldn't set up the native node_modules overlay — tests run (slowly) off the bind mount."
    fi
}

# Install a headless Chromium and register a sandbox-local chrome-devtools MCP server that
# drives it. arm64 has no distro Chrome package (and Google ships no arm64 deb), so Playwright
# — the only source of an arm64 build — provides the binary; chrome-devtools-mcp attaches via
# --executablePath and launches it headless. Registered at USER scope so the shared committed
# config (which drives the host's own Chrome) is untouched, and the chrome-devtools plugin is
# inactive in the sandbox anyway (provision installs only the three it needs). Bounded +
# best-effort: on failure the browser tools are simply absent; the rest of the sandbox is fine.
setup_browser() {
    local name="$1"
    echo "Installing headless Chromium for browser automation (first run only, ~2 min)..."
    sbx policy allow network --sandbox "$name" "cdn.playwright.dev,*.playwright.dev,playwright.download.prss.microsoft.com,*.prss.microsoft.com" >/dev/null 2>&1 || true
    if sbx exec "$name" bash -lc '
        set -e
        npx -y playwright@latest install chromium >/dev/null 2>&1
        # install-deps uses apt; wait out any startup apt still holding the lock.
        for _ in $(seq 1 30); do sudo fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || break; sleep 2; done
        sudo npx -y playwright@latest install-deps chromium >/dev/null 2>&1
        bin=$(find "$HOME/.cache/ms-playwright"/chromium-*/chrome-linux -type f -name chrome | head -1)
        [ -n "$bin" ]
        claude mcp add -s user chrome-devtools -- npx -y chrome-devtools-mcp@latest --executablePath "$bin" --headless --chromeArg=--no-sandbox --usageStatistics=false >/dev/null
    '; then
        echo "Browser automation ready — the chrome-devtools tools drive an in-sandbox headless Chrome."
    else
        echo "⚠ Browser automation setup failed — chrome-devtools tools will be unavailable (sandbox otherwise fine)."
    fi
}

# Wire the host's SonarCloud token so the sonarqube-fix skill (`pnpm sonar`) works in the mount.
# Only runs if the host has SONAR_TOKEN exported. Allows the Sonar host and writes the token to
# the sandbox's persistent env file (sourced by login shells). NOTE: this is the one host
# credential that lives inside the sandbox — sbx's proxy-injected secrets don't reach the agent
# unless set before create, so there's no token-stays-out path without a recreate. Mount only.
setup_sonar() {
    local name="$1"
    [ -n "${SONAR_TOKEN:-}" ] || return 0
    sbx policy allow network --sandbox "$name" "sonarcloud.io" >/dev/null 2>&1 || true
    if sbx exec "$name" bash -lc 'sudo sed -i "/SONAR_TOKEN/d" /etc/sandbox-persistent.sh; printf "export SONAR_TOKEN=%s\n" "$1" | sudo tee -a /etc/sandbox-persistent.sh >/dev/null' _ "$SONAR_TOKEN"; then
        echo "SonarCloud token wired — the sonarqube-fix skill works in the mount."
    else
        echo "⚠ Couldn't wire the SonarCloud token — the sonarqube skill won't authenticate."
    fi
}

session_dir() {
    printf '%s/.claude/projects/%s' "$HOME" "$(printf '%s' "$REPO_ROOT" | sed 's#/#-#g')"
}

ide_dir() {
    printf '%s/.claude/ide' "$HOME"
}

# Symlink the RW-mounted host session dir (history + memory) into the sandbox home,
# where Claude looks for it — host and sandbox homes differ. Bounded + retried; the
# editor lock dir is linked separately in ide_link.
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

cmd_mount() {
    require_sbx
    # pnpm forwards its "--" separator through to us; drop it so it doesn't reach Claude.
    if [ "${1:-}" = "--" ]; then shift; fi
    if ! sandbox_exists "$MOUNT_NAME"; then
        echo "Creating mount sandbox '$MOUNT_NAME'..."
        local extra=()
        if [ -d "$(session_dir)" ]; then extra+=("$(session_dir)"); fi
        # Editor-lock dir is mounted READ-ONLY: the sandbox only reads locks to discover
        # Neovim; a RW mount let the sandbox's failed connect delete the host's lock.
        if [ -d "$(ide_dir)" ]; then extra+=("$(ide_dir):ro"); fi
        sbx create claude "$REPO_ROOT" ${extra[@]+"${extra[@]}"} --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
        provision_sandbox "$MOUNT_NAME"
        link_host_dirs "$MOUNT_NAME"
        setup_browser "$MOUNT_NAME"
        setup_sonar "$MOUNT_NAME"
    fi
    ide_link "$MOUNT_NAME"
    native_node_modules "$MOUNT_NAME"
    local note="${BASE_NOTE}"$'\n\n'"${MOUNT_NOTE}"
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
        --settings "$DISABLE_HOST_CHROME_PLUGIN" \
        --append-system-prompt "$note" \
        "$@"
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

cmd_clone() {
    require_sbx
    # pnpm forwards its "--" separator through to us; drop it so it doesn't reach Claude.
    if [ "${1:-}" = "--" ]; then shift; fi
    if ! sandbox_exists "$CLONE_NAME"; then
        echo "Creating clone sandbox '$CLONE_NAME'..."
        sbx create --clone claude "$REPO_ROOT" --name "$CLONE_NAME"
        # The clone inherits the host's SSH origin, which needs a key the sandbox doesn't have.
        # Point it at HTTPS so the agent can fetch/pull the (public) repo with no credentials —
        # e.g. to branch off the latest master. Pushing still fails (no creds), which is intended.
        sbx exec "$CLONE_NAME" bash -lc 'cd "$1" && git remote set-url origin "$(git remote get-url origin | sed -E "s#git@github.com:#https://github.com/#")"' _ "$REPO_ROOT" || true
        # Disable git hooks in the clone: the per-edit format hook and the "run pnpm
        # test/lint before finishing" instruction already cover lint/types/tests, and
        # the clone never pushes (pre-push never fires) — so hooks only add friction to
        # autonomous commit-as-you-go. HUSKY=0 skips all three (see .hooks/pre-commit).
        sbx exec "$CLONE_NAME" bash -lc 'sudo sed -i "/export HUSKY=/d" /etc/sandbox-persistent.sh; printf "export HUSKY=0\n" | sudo tee -a /etc/sandbox-persistent.sh >/dev/null' || true
        provision_sandbox "$CLONE_NAME"
        setup_browser "$CLONE_NAME"
        echo "Installing dependencies in the clone (generate-types hits the DHIS2 instance; includes the Cypress binary)..."
        sbx exec "$CLONE_NAME" bash -lc 'cd "$1" && pnpm install' _ "$REPO_ROOT" \
            || echo "⚠ Dependency install failed — the agent can retry with: pnpm install"
        copy_memory "$CLONE_NAME"
        maybe_inject_dhis2_creds "$CLONE_NAME"
    fi
    local note="${BASE_NOTE}"$'\n\n'"${CLONE_NOTE}"
    sbx run "$CLONE_NAME" -- \
        --dangerously-skip-permissions \
        --settings "$DISABLE_HOST_CHROME_PLUGIN" \
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

# Rebuild the mount's native node_modules snapshot from the current host install.
# Use after changing dependencies on the host while the sandbox is running; a fresh
# mount picks up lockfile changes automatically, this avoids the re-mount cycle.
cmd_refresh_deps() {
    require_sbx
    if ! sandbox_exists "$MOUNT_NAME"; then
        echo "No mount sandbox '$MOUNT_NAME' — run 'pnpm sbx:mount' first." >&2
        exit 1
    fi
    echo "Rebuilding native node_modules cache from the host install..."
    sbx exec "$MOUNT_NAME" bash -lc '
        sudo umount "$1/node_modules" 2>/dev/null || sudo umount -l "$1/node_modules" 2>/dev/null || true
        rm -rf /home/agent/nm && cp -a "$1/node_modules" /home/agent/nm && touch /home/agent/nm
        sudo mount --bind /home/agent/nm "$1/node_modules"
        echo "Refreshed."
    ' _ "$REPO_ROOT"
}

cmd_purge() {
    require_sbx
    sbx rm --force "$MOUNT_NAME" "$CLONE_NAME" || true
}

cmd_setup() {
    require_sbx
    sbx login
    if ! sbx policy set-default balanced 2>/dev/null; then
        echo "Network policy already set — keeping it. (To change: sbx policy reset, then re-run setup.)"
    fi
    printf 'Store an Anthropic API key? Subscription users skip this and sign in via OAuth on first mount. [y/N] '
    local areply
    read -r areply || areply=""
    case "$areply" in
        [yY]*) sbx secret set -g anthropic ;;
        *) echo "Skipping — Claude will prompt for interactive OAuth login on first 'pnpm sbx:mount'." ;;
    esac
    printf 'Configure an optional context7 API key (higher rate limits)? [y/N] '
    local reply
    read -r reply || reply=""
    case "$reply" in
        [yY]*)
            printf 'context7 API key: '
            local key
            read -rs key || key=""
            echo
            if [ -n "$key" ]; then
                sbx secret set-custom -g --host context7.com --env CONTEXT7_API_KEY --value "$key"
                echo "context7 key stored (proxy-injected; never exposed inside the sandbox)."
            else
                echo "No key entered — skipping."
            fi
            ;;
        *) echo "Skipped context7 key (works keyless at a lower rate limit)." ;;
    esac
    echo "GitHub auth is intentionally NOT configured for sandboxes (security)."
    echo "Setup complete. Run 'pnpm sbx:mount' or 'pnpm sbx:clone'."
}

case "${1:-}" in
    mount)        cmd_mount "${@:2}" ;;
    clone)        cmd_clone "${@:2}" ;;
    sync-clone)   cmd_sync_clone ;;
    reset-clone)  cmd_reset_clone ;;
    refresh-deps) cmd_refresh_deps ;;
    purge)        cmd_purge ;;
    setup)        cmd_setup ;;
    *)
        echo "Usage: scripts/sbx.sh {mount|clone|sync-clone|reset-clone|refresh-deps|purge|setup}" >&2
        exit 1
        ;;
esac
