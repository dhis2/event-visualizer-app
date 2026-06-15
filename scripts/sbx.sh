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
    ' _ "$PNPM_VERSION" "$MARKETPLACE"
}

read -r -d '' BASE_NOTE <<'EOF' || true
You are running inside an isolated Docker Sandboxes microVM with its own filesystem, network, and Docker daemon.
You have passwordless sudo. Install OS packages with `sudo apt-get install ...` — they persist for the sandbox's lifetime. Install home-directory or user-level tools WITHOUT sudo, or they install under /root/ and will not be on your PATH.
Outbound network is restricted by a "balanced" policy. Permission prompts are skipped because of this isolation, not because the environment is unconditionally safe — still avoid destructive or data-exfiltrating actions.
EOF

read -r -d '' MOUNT_NOTE <<'EOF' || true
These are the human's LIVE working files, bind-mounted from the host; your edits appear immediately in their editor.
You may install dependencies and run tests/build here. node_modules becomes Linux-built, which is expected.
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

host_ide_lock() {
    node -e '
        const fs = require("fs"), os = require("os"), path = require("path");
        const dir = path.join(os.homedir(), ".claude", "ide");
        let best = null;
        try {
            for (const f of fs.readdirSync(dir)) {
                if (!f.endsWith(".lock")) continue;
                const fp = path.join(dir, f);
                let o;
                try { o = JSON.parse(fs.readFileSync(fp, "utf8")); } catch (e) { continue; }
                if (!(o.workspaceFolders || []).includes(process.argv[1])) continue;
                const mt = fs.statSync(fp).mtimeMs;
                if (!best || mt > best.mt) best = { port: path.basename(f, ".lock"), fp, mt };
            }
        } catch (e) {}
        if (best) process.stdout.write(best.port + " " + best.fp);
    ' "$REPO_ROOT"
}

ide_link() {
    local name="$1"
    [ "${SBX_NO_IDE:-}" = "1" ] && return 0
    local info port lock fwd
    info="$(host_ide_lock)" || true
    if [ -z "$info" ]; then
        echo "No host editor detected for this repo — skipping IDE link."
        return 0
    fi
    port="${info%% *}"
    lock="${info#* }"
    echo "Linking host editor (Neovim, WS port $port)..."
    sbx policy allow network --sandbox "$name" "localhost:${port},host.docker.internal" >/dev/null
    sbx exec "$name" bash -lc 'mkdir -p "$HOME/.claude/ide"'
    sbx cp "$lock" "${name}:/home/agent/.claude/ide/${port}.lock"
    fwd="$(mktemp)"
    printf '%s' "$IDE_FORWARDER_PY" > "$fwd"
    sbx cp "$fwd" "${name}:/tmp/sbx-ide-forward.py"
    rm -f "$fwd"
    sbx exec -d "$name" python3 /tmp/sbx-ide-forward.py "$port" >/dev/null 2>&1 || true
    echo "Editor link ready — run /ide in the session to connect to Neovim."
}

cmd_mount() {
    require_sbx
    if ! sandbox_exists "$MOUNT_NAME"; then
        echo "Creating mount sandbox '$MOUNT_NAME'..."
        sbx create claude "$REPO_ROOT" --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
        provision_sandbox "$MOUNT_NAME"
    fi
    ide_link "$MOUNT_NAME"
    local note="${BASE_NOTE}"$'\n\n'"${MOUNT_NOTE}"
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "$note"
}

cmd_clone() {
    require_sbx
    if ! sandbox_exists "$CLONE_NAME"; then
        echo "Creating clone sandbox '$CLONE_NAME'..."
        sbx create --clone claude "$REPO_ROOT" --name "$CLONE_NAME"
        provision_sandbox "$CLONE_NAME"
        maybe_inject_dhis2_creds "$CLONE_NAME"
    fi
    local note="${BASE_NOTE}"$'\n\n'"${CLONE_NOTE}"
    sbx run "$CLONE_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "$note"
    echo
    echo "Retrieve the clone's commits on the host with:"
    echo "  git fetch sandbox-${CLONE_NAME}"
    echo "  git log sandbox-${CLONE_NAME}/<branch>"
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

cmd_purge() {
    require_sbx
    sbx rm --force "$MOUNT_NAME" "$CLONE_NAME" || true
}

cmd_setup() {
    require_sbx
    sbx login
    sbx policy set-default balanced
    echo "Store your Anthropic credential (read from your input; never written to the repo):"
    sbx secret set -g anthropic
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
    mount)       cmd_mount ;;
    clone)       cmd_clone ;;
    reset-clone) cmd_reset_clone ;;
    purge)       cmd_purge ;;
    setup)       cmd_setup ;;
    *)
        echo "Usage: scripts/sbx.sh {mount|clone|reset-clone|purge|setup}" >&2
        exit 1
        ;;
esac
