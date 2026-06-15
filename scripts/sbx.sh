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

cmd_mount() {
    require_sbx
    if ! sandbox_exists "$MOUNT_NAME"; then
        echo "Creating mount sandbox '$MOUNT_NAME'..."
        sbx create claude "$REPO_ROOT" --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
        provision_sandbox "$MOUNT_NAME"
    fi
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
