#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT="$(basename "$REPO_ROOT")"
MOUNT_NAME="${PROJECT}-mount"
CLONE_NAME="${PROJECT}-clone"
DEV_PORT=3000
MARKETPLACE="anthropics/claude-plugins-official"
PNPM_VERSION="$(node -p "require('$REPO_ROOT/package.json').packageManager.split('@')[1].split('+')[0]" 2>/dev/null || echo latest)"

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
    local hosts="mcp.grep.app,context7.com,*.context7.com"
    local dhis
    dhis="$(dhis2_host)"
    [ -n "$dhis" ] && hosts="${hosts},${dhis}"
    echo "Configuring network policy for '$name'..."
    sbx policy allow network --sandbox "$name" "$hosts" >/dev/null
    echo "Provisioning '$name' (pnpm + plugins; first run only, takes a minute)..."
    sbx exec "$name" bash -lc '
        set -e
        sudo npm i -g "pnpm@$1" >/dev/null 2>&1
        claude plugin marketplace add "$2" >/dev/null
        claude plugin install typescript-lsp@claude-plugins-official >/dev/null
        claude plugin install context7@claude-plugins-official >/dev/null
        claude plugin install superpowers@claude-plugins-official >/dev/null
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
EOF

read -r -d '' CLONE_NOTE <<'EOF' || true
This OVERRIDES the project CLAUDE.md "do not commit" rule. That rule protects the human's live working tree and does not apply here — you are on a private, isolated clone of the repository.
Work autonomously: create a feature branch, run `pnpm test` and `pnpm lint`, and commit your progress as you go. Do not push to forge remotes (origin/upstream).
A read-only copy of the host repo is mounted at /run/sandbox/source. Pull host updates with `git pull /run/sandbox/source <branch>`. The human retrieves your commits from the host via this sandbox's git remote.
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
# macOS has no `timeout`, so this is a portable stand-in.
run_with_timeout() {
    local secs="$1"; shift
    "$@" >/dev/null 2>&1 &
    local pid=$! i=0
    while kill -0 "$pid" 2>/dev/null; do
        if [ "$i" -ge "$secs" ]; then
            kill -TERM "$pid" 2>/dev/null
            wait "$pid" 2>/dev/null
            return 124
        fi
        sleep 1
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
    local name="$1" ports port fwd up
    if [ -d "$(ide_dir)" ]; then
        if ! retry 2 12 sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude"; rm -rf "$HOME/.claude/ide"; ln -sfn "$1" "$HOME/.claude/ide"' _ "$(ide_dir)"; then
            ide_msg "⚠ Editor integration: couldn't link the lock dir (sbx not responding) — /ide won't connect. Sandbox is otherwise fine."
            return 0
        fi
    fi
    ports="$(live_ide_ports)"
    if [ -z "$ports" ]; then
        ide_msg "Editor integration: no live Neovim for this repo — /ide will be empty (start Neovim, then re-run mount)."
        return 0
    fi
    fwd="$(mktemp)"
    printf '%s' "$IDE_FORWARDER_PY" > "$fwd"
    chmod 644 "$fwd"   # sbx cp preserves host uid/mode; make it readable by the sandbox's agent user
    if ! retry 2 12 sbx cp "$fwd" "${name}:/tmp/sbx-ide-forward.py"; then
        rm -f "$fwd"
        ide_msg "⚠ Editor integration: couldn't copy the forwarder (sbx not responding) — /ide won't connect."
        return 0
    fi
    rm -f "$fwd"
    for port in $ports; do
        retry 2 12 sbx policy allow network --sandbox "$name" "localhost:${port},host.docker.internal" || true
        # `sbx exec -d` can report a nonzero exit even when it starts the process, so don't
        # trust its exit code — start it, then verify the forwarder is actually listening.
        retry 2 12 sbx exec -d "$name" python3 /tmp/sbx-ide-forward.py "$port" || true
        up=""
        for _ in 1 2 3; do
            if run_with_timeout 8 sbx exec "$name" bash -lc 'exec 3<>/dev/tcp/127.0.0.1/'"$port"; then up=1; break; fi
            sleep 1
        done
        if [ -n "$up" ]; then
            echo "  Host editor linked on port $port. If Claude doesn't auto-connect, run /ide in the session to connect."
        else
            echo "  ⚠ Editor integration: forwarder for port $port isn't listening — /ide won't connect."
        fi
    done
    sleep 3
}

# Exit 0 if the native node_modules snapshot exists and is no older than the
# lockfile (so it can be reused without a fresh copy), nonzero otherwise. Bounded.
snapshot_fresh() {
    run_with_timeout 12 sbx exec "$1" bash -lc '
        nm=/home/agent/nm
        [ -d "$nm" ] && [ ! "$1/pnpm-lock.yaml" -nt "$nm" ]
    ' _ "$REPO_ROOT"
}

# Overlay the bind-mounted node_modules with a copy on the sandbox's native fs.
# The bind mount makes test/build I/O ~5x slower — every module-resolution stat pays
# virtualization latency, and vitest cold-loads the whole graph (incl. jsdom) per file.
# The copy is a snapshot, rebuilt when pnpm-lock.yaml changes (or via "refresh-deps").
# Container-local (sudo mount --bind) — the host node_modules is never touched. The
# sudo mount does not survive a sandbox restart, so this re-applies on every mount;
# the copy itself is reused when fresh. Best-effort + bounded: on failure tests still
# run, just slowly off the bind mount.
native_node_modules() {
    local name="$1"
    if run_with_timeout 12 sbx exec "$name" mountpoint -q "$REPO_ROOT/node_modules"; then
        return 0
    fi
    if ! snapshot_fresh "$name"; then
        echo "Building native node_modules cache (faster tests; ~2 min, first mount or after dep changes)..."
        if ! run_with_timeout 360 sbx exec "$name" bash -lc '
            rm -rf /home/agent/nm && cp -a "$1/node_modules" /home/agent/nm && touch /home/agent/nm
        ' _ "$REPO_ROOT"; then
            echo "⚠ Couldn't build the native node_modules cache — tests will run (slowly) off the bind mount."
            return 0
        fi
    fi
    if run_with_timeout 30 sbx exec "$name" sudo mount --bind /home/agent/nm "$REPO_ROOT/node_modules"; then
        echo "Native node_modules active — test/build I/O much faster (host node_modules untouched)."
    else
        echo "⚠ Couldn't overlay native node_modules — tests will run (slowly) off the bind mount."
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
    fi
    ide_link "$MOUNT_NAME"
    native_node_modules "$MOUNT_NAME"
    local note="${BASE_NOTE}"$'\n\n'"${MOUNT_NOTE}"
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
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
        provision_sandbox "$CLONE_NAME"
        copy_memory "$CLONE_NAME"
        maybe_inject_dhis2_creds "$CLONE_NAME"
    fi
    local note="${BASE_NOTE}"$'\n\n'"${CLONE_NOTE}"
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
