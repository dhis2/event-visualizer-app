# sbx AI Sandboxes Implementation Plan

> **For agentic clones:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two opt-in, project-scoped AI sandboxes (`pnpm sbx:mount` for hands-on live-file work, `pnpm sbx:clone` for autonomous clone work) built on Docker Sandboxes (`sbx`).

**Architecture:** A single committed `scripts/sbx.sh` holds all logic and exposes subcommands (`mount`, `clone`, `reset-clone`, `purge`, `setup`). Two thin `package.json` scripts wrap the common ones. Every subcommand bails out gracefully if `sbx` is not installed, so the repo is unaffected for non-users. Layered agent instructions are passed via `claude --append-system-prompt`. The mount sandbox bind-mounts the live repo (sharing `node_modules`); the clone sandbox uses `--clone` for full isolation.

**Tech Stack:** Bash, Docker Sandboxes (`sbx` v0.32.0), pnpm, Claude Code CLI.

**Spec:** `docs/superpowers/specs/2026-06-12-sbx-ai-sandboxes-design.md`

**Repo conventions that apply:**

- **The agent does NOT stage or commit** (per CLAUDE.md). Each task ends with a verified checkpoint and a suggested commit message; the human commits.
- PostToolUse hooks auto-run Prettier/ESLint on `package.json`/`README.md` edits. `scripts/sbx.sh` is bash and is not auto-formatted — verify it manually.

---

### Task 1: Create `scripts/sbx.sh`

**Files:**

- Create: `scripts/sbx.sh`

- [ ] **Step 1: Write the script**

Create `scripts/sbx.sh` with exactly this content:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT="$(basename "$REPO_ROOT")"
MOUNT_NAME="${PROJECT}-mount"
CLONE_NAME="${PROJECT}-clone"
DEV_PORT=3000

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

cmd_mount() {
    require_sbx
    if ! sandbox_exists "$MOUNT_NAME"; then
        echo "Creating mount sandbox '$MOUNT_NAME'..."
        sbx create claude "$REPO_ROOT" --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
    fi
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "${BASE_NOTE}

${MOUNT_NOTE}"
}

cmd_clone() {
    require_sbx
    if ! sandbox_exists "$CLONE_NAME"; then
        echo "Creating clone sandbox '$CLONE_NAME'..."
        sbx create --clone claude "$REPO_ROOT" --name "$CLONE_NAME"
    fi
    sbx run "$CLONE_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "${BASE_NOTE}

${CLONE_NOTE}"
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
    echo "Setup complete. Run 'pnpm sbx:mount' or 'pnpm sbx:clone'."
}

case "${1:-}" in
    mount)        cmd_mount ;;
    clone)       cmd_clone ;;
    reset-clone) cmd_reset_clone ;;
    purge)        cmd_purge ;;
    setup)        cmd_setup ;;
    *)
        echo "Usage: scripts/sbx.sh {mount|clone|reset-clone|purge|setup}" >&2
        exit 1
        ;;
esac
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/sbx.sh`
Expected: no output.

- [ ] **Step 3: Syntax check**

Run: `bash -n scripts/sbx.sh`
Expected: no output, exit code 0 (no syntax errors).

- [ ] **Step 4: Lint with shellcheck if available**

Run: `command -v shellcheck >/dev/null && shellcheck scripts/sbx.sh || echo "shellcheck not installed — skipping (optional: brew install shellcheck)"`
Expected: either no findings, or the skip message. If shellcheck reports issues, fix them; `SC2034` on the note variables is a false positive (they are used inside the `--append-system-prompt` strings) and may be ignored.

- [ ] **Step 5: Verify the no-args usage path**

Run: `scripts/sbx.sh; echo "exit=$?"`
Expected: prints `Usage: scripts/sbx.sh {mount|clone|reset-clone|purge|setup}` and `exit=1`.

- [ ] **Step 6: Verify the opt-out guard (simulate sbx absent)**

Run: `PATH=/usr/bin:/bin scripts/sbx.sh purge; echo "exit=$?"`
Expected: prints `Docker Sandboxes not installed — run 'brew install sbx' to use the AI sandboxes.` and `exit=0`. (This strips `sbx` from PATH while keeping `git`/`bash`.)

- [ ] **Step 7: Checkpoint**

Suggested commit message for the user:

```
feat: add opt-in sbx AI sandbox script
```

---

### Task 2: Wire up `package.json` scripts

**Files:**

- Modify: `package.json` (the `scripts` object)

- [ ] **Step 1: Read the current scripts block**

Run: `grep -n '"scripts"' package.json` then read the surrounding lines to find the exact location and the existing entries (`build`, `start`, `deploy`, `test`, `lint`, …).

- [ ] **Step 2: Add the two entries**

Add these two keys to the `"scripts"` object (placement within the object does not matter; keep the file valid JSON — ensure commas are correct):

```json
        "sbx:mount": "scripts/sbx.sh mount",
        "sbx:clone": "scripts/sbx.sh clone",
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./package.json'); console.log('valid json')"`
Expected: prints `valid json`.

- [ ] **Step 4: Verify the scripts resolve**

Run: `pnpm run 2>&1 | grep -E 'sbx:(mount|clone)'`
Expected: both `sbx:mount` and `sbx:clone` appear in the listed scripts.

- [ ] **Step 5: Checkpoint**

The PostToolUse hook will have run Prettier on `package.json`; confirm no further formatting is needed with `pnpm exec prettier --check package.json` (expected: no warnings).

Suggested commit message for the user:

```
feat: add pnpm sbx:mount and sbx:clone scripts
```

---

### Task 3: Document the sandboxes in the README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Find a sensible insertion point**

Run: `grep -nE '^#' README.md | head -40` to list headings. Insert the new section after the existing development/getting-started content and before any deployment/license trailer. Match the heading depth of the surrounding sections.

- [ ] **Step 2: Add the section**

Insert this Markdown (adjust the heading level `##`/`###` to match neighbouring sections):

````markdown
## AI sandboxes (opt-in)

Two optional, isolated AI workspaces built on [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) (`sbx`). They are fully opt-in — if you do not install `sbx`, nothing here affects you.

**One-time setup:**

```bash
brew install sbx
scripts/sbx.sh setup   # Docker login, network policy, Anthropic credential
```
````

**Mount sandbox — hands-on, live files** (`pnpm sbx:mount`)

The agent edits your live working tree (changes show up in your editor immediately) and can run tests/build inside the sandbox, with no permission prompts but a constrained network. You review diffs and commit on the host. A dev server the agent starts is published to `http://localhost:3000`.

> **node_modules note:** the repo is bind-mounted, so `node_modules` is shared with the host. When the agent installs/runs tests inside the sandbox it rebuilds `node_modules` for Linux. Your editor, ESLint, Prettier, and `tsc` keep working regardless. Only running the app/tests **natively on your host** needs a `pnpm install` first (fast — your pnpm store is warm).

**Clone sandbox — autonomous clone** (`pnpm sbx:clone`)

The agent works on a private, isolated clone: it branches, runs tests, and commits on its own. Your host `node_modules` is never touched. Retrieve its work:

```bash
git fetch sandbox-event-visualizer-app-clone
git log sandbox-event-visualizer-app-clone/<branch>
```

**Other commands:**

```bash
scripts/sbx.sh reset-clone   # wipe the clone back to a clean checkout
scripts/sbx.sh purge          # remove both sandboxes
```

Not all host MCP servers are available inside a sandbox — only project-level configuration in the repo is picked up.

```

- [ ] **Step 3: Verify the rendered Markdown**

Run: `pnpm exec prettier --check README.md`
Expected: no warnings (the PostToolUse hook should already have formatted it; if it reports issues run `pnpm exec prettier --write README.md`).

- [ ] **Step 4: Checkpoint**

Suggested commit message for the user:

```

docs: document opt-in sbx AI sandboxes in README

```

---

### Task 4: Interactive smoke test (manual, requires Docker + sbx)

This task cannot be automated (it pulls images and attaches an interactive agent). Run it once to confirm the end-to-end flow. Skip the destructive sub-steps if you do not want live sandboxes left around.

**Files:** none (verification only)

- [ ] **Step 1: One-time setup (if not already done)**

Run: `scripts/sbx.sh setup`
Expected: completes `sbx login`, sets the `balanced` policy, stores the Anthropic secret.

- [ ] **Step 2: Launch the mount sandbox**

Run: `pnpm sbx:mount`
Expected: on first run it prints `Creating mount sandbox 'event-visualizer-app-mount'...`, publishes port 3000, then attaches an interactive Claude session with no permission prompts. Inside the session, confirm `pwd` shows the repo path and `whoami` works with `sudo -n true` succeeding (passwordless sudo).

- [ ] **Step 3: Confirm the dev server is reachable from the host**

Inside the mount session, start the dev server (`pnpm start`). On the host, open `http://localhost:3000` and confirm the app loads. Exit the session afterwards.

- [ ] **Step 4: Launch the clone sandbox**

Run: `pnpm sbx:clone`
Expected: prints `Creating clone sandbox 'event-visualizer-app-clone'...`, attaches a session, and on exit prints the `git fetch sandbox-event-visualizer-app-clone` retrieval instructions. Inside, confirm `/run/sandbox/source` exists and `git status` works on the clone.

- [ ] **Step 5: Verify reset and purge**

Run: `scripts/sbx.sh reset-clone` (expected: clone working tree reset, exits cleanly), then `scripts/sbx.sh purge` (expected: both sandboxes removed; re-running prints nothing fatal).

- [ ] **Step 6: Note**

If anything in this task fails, capture the exact `sbx` error and revisit the spec — do not paper over it in `scripts/sbx.sh`.
```
