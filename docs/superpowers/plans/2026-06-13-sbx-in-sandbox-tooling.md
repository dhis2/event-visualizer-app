# sbx In-Sandbox Tooling (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provision the `mount`/`clone` sandboxes so the project's tooling works inside them — pnpm, the `typescript-lsp` and `context7` plugins, the `grep` MCP, the format hook, and DHIS2 reachability — while deliberately withholding GitHub credentials.

**Architecture:** Extend `scripts/sbx.sh`. On first create, the script provisions each sandbox: host-side `sbx policy allow network` rules, then in-sandbox installs via `sbx exec` (pnpm + plugins). `setup` gains an optional context7 key via `sbx secret set-custom`; it never stores a github secret. The clone optionally gets `cypress.env.json` copied in. Browser tooling is out of scope (deferred upstream).

**Tech Stack:** Bash, Docker Sandboxes (`sbx` v0.32.0), Claude Code plugin CLI, pnpm, node.

**Spec:** `docs/superpowers/specs/2026-06-13-sbx-in-sandbox-tooling-design.md`

**Repo conventions:**

- **The agent does NOT stage or commit** (per CLAUDE.md). Each task ends at a verified checkpoint with a suggested commit message; the human commits.
- Most behavior needs a live sandbox (Docker pulls + auth), so it is validated in the manual smoke test (Task 6), not automatable here. Non-live checks use `bash -n`, `grep`, and the usage/guard paths.
- `scripts/sbx.sh` is bash — not auto-formatted by hooks. Verify manually with `bash -n`.

**Starting point:** `scripts/sbx.sh` already has `REPO_ROOT`, `PROJECT`, `MOUNT_NAME`, `CLONE_NAME`, `DEV_PORT`, `require_sbx`, `sandbox_exists`, `default_branch`, the `BASE_NOTE`/`MOUNT_NOTE`/`CLONE_NOTE` heredocs, and `cmd_mount`/`cmd_clone`/`cmd_reset_clone`/`cmd_purge`/`cmd_setup` with a `case` dispatch.

> **Execution note (2026-06-13):** Live testing confirmed the `--clone` checkout lives at `$REPO_ROOT` inside the container (writable, isolated from the host), so the `clone_repo_path` helper in Task 2 was dropped as unnecessary — `maybe_inject_dhis2_creds` takes only `name` and `sbx cp`s straight to `$REPO_ROOT/cypress.env.json`. Provisioning, the DHIS2 cp, and `cmd_purge` were validated end-to-end; the live agent-session checks (Task 6 steps 2–3) still need interactive auth.

---

### Task 1: Add config vars and the provisioning helpers

**Files:**

- Modify: `scripts/sbx.sh`

- [ ] **Step 1: Add config constants after the existing `DEV_PORT=3000` line**

Locate:

```bash
DEV_PORT=3000
```

Add immediately below it:

```bash
MARKETPLACE="anthropics/claude-plugins-official"
PNPM_VERSION="$(node -p "require('$REPO_ROOT/package.json').packageManager.split('@')[1].split('+')[0]" 2>/dev/null || echo latest)"
```

- [ ] **Step 2: Add the `dhis2_host` and `provision_sandbox` helpers after the `default_branch()` function**

Locate the end of:

```bash
default_branch() {
    local branch
    branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
    echo "${branch:-master}"
}
```

Add below it:

```bash
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
```

- [ ] **Step 3: Syntax check**

Run: `bash -n scripts/sbx.sh`
Expected: no output, exit 0.

- [ ] **Step 4: Verify `PNPM_VERSION` parses on the host**

Run: `node -p "require('$PWD/package.json').packageManager.split('@')[1].split('+')[0]"`
Expected: prints `11.5.2`.

- [ ] **Step 5: Verify the helpers are defined and usage still works**

Run: `grep -nE 'provision_sandbox\(\)|dhis2_host\(\)|^MARKETPLACE=' scripts/sbx.sh` then `scripts/sbx.sh; echo "exit=$?"`
Expected: the three definitions are found; usage prints and `exit=1`.

- [ ] **Step 6: Checkpoint**

Suggested commit message for the user:

```
feat: add sbx sandbox provisioning helpers (pnpm, plugins, network policy)
```

---

### Task 2: Wire provisioning into `cmd_mount` and `cmd_clone`, with clone DHIS2 opt-in

**Files:**

- Modify: `scripts/sbx.sh`

- [ ] **Step 1: Add the `maybe_inject_dhis2_creds` helper directly above `cmd_mount()`**

```bash
maybe_inject_dhis2_creds() {
    local name="$1"
    local dest="$2"
    [ -f "$REPO_ROOT/cypress.env.json" ] || return 0
    printf 'Inject cypress.env.json (DHIS2 test creds) into the clone for e2e? [y/N] '
    local reply
    read -r reply || reply=""
    case "$reply" in
        [yY]*)
            sbx cp "$REPO_ROOT/cypress.env.json" "${name}:${dest}/cypress.env.json"
            echo "Copied cypress.env.json into the clone at ${dest}."
            ;;
        *) echo "Skipped DHIS2 creds." ;;
    esac
}
```

- [ ] **Step 2: Call `provision_sandbox` in `cmd_mount`**

Locate in `cmd_mount`:

```bash
        sbx create claude "$REPO_ROOT" --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
    fi
```

Replace with:

```bash
        sbx create claude "$REPO_ROOT" --name "$MOUNT_NAME"
        sbx ports "$MOUNT_NAME" --publish "${DEV_PORT}:${DEV_PORT}" || true
        provision_sandbox "$MOUNT_NAME"
    fi
```

- [ ] **Step 3: Call `provision_sandbox` and the DHIS2 opt-in in `cmd_clone`**

Locate in `cmd_clone`:

```bash
        echo "Creating clone sandbox '$CLONE_NAME'..."
        sbx create --clone claude "$REPO_ROOT" --name "$CLONE_NAME"
    fi
```

Replace with:

```bash
        echo "Creating clone sandbox '$CLONE_NAME'..."
        sbx create --clone claude "$REPO_ROOT" --name "$CLONE_NAME"
        provision_sandbox "$CLONE_NAME"
        maybe_inject_dhis2_creds "$CLONE_NAME" "$(clone_repo_path "$CLONE_NAME")"
    fi
```

- [ ] **Step 4: Add the `clone_repo_path` helper directly above `maybe_inject_dhis2_creds`**

The clone-mode checkout path inside the container is not the host path, so resolve it at runtime (the agent's clone is a git work tree; find the dir containing `.git` under the agent home, falling back to the host path):

```bash
clone_repo_path() {
    local name="$1"
    local path
    path="$(sbx exec "$name" bash -lc 'git -C ~/workspace rev-parse --show-toplevel 2>/dev/null || find ~ -maxdepth 3 -name .git -type d 2>/dev/null | head -1 | xargs -r dirname' 2>/dev/null | tr -d "\r")"
    echo "${path:-$REPO_ROOT}"
}
```

- [ ] **Step 5: Syntax check**

Run: `bash -n scripts/sbx.sh`
Expected: no output, exit 0.

- [ ] **Step 6: Verify the wiring**

Run: `grep -nE 'provision_sandbox "\$(MOUNT|CLONE)_NAME"|maybe_inject_dhis2_creds|clone_repo_path' scripts/sbx.sh`
Expected: `provision_sandbox "$MOUNT_NAME"` and `provision_sandbox "$CLONE_NAME"` both appear; `maybe_inject_dhis2_creds` and `clone_repo_path` are defined and called.

- [ ] **Step 7: Checkpoint**

Suggested commit message for the user:

```
feat: provision mount/clone sandboxes on create; clone DHIS2 cred opt-in
```

---

### Task 3: Extend `cmd_setup` with the optional context7 key (no github)

**Files:**

- Modify: `scripts/sbx.sh`

- [ ] **Step 1: Replace the body of `cmd_setup`**

Locate:

```bash
cmd_setup() {
    require_sbx
    sbx login
    sbx policy set-default balanced
    echo "Store your Anthropic credential (read from your input; never written to the repo):"
    sbx secret set -g anthropic
    echo "Setup complete. Run 'pnpm sbx:mount' or 'pnpm sbx:clone'."
}
```

Replace with:

```bash
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
```

- [ ] **Step 2: Syntax check**

Run: `bash -n scripts/sbx.sh`
Expected: no output, exit 0.

- [ ] **Step 3: Confirm no github secret is referenced anywhere**

Run: `grep -niE 'secret set .*github|set -g github' scripts/sbx.sh || echo "no github secret — good"`
Expected: prints `no github secret — good`.

- [ ] **Step 4: Checkpoint**

Suggested commit message for the user:

```
feat: optional context7 key in sbx setup; no github auth in sandboxes
```

---

### Task 4: Update the README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add a provisioning note after the Mount/Clone descriptions**

Find the "AI sandboxes (opt-in)" section. After the **Clone sandbox** paragraph and before the "Other commands" block, insert:

```markdown
> **First run provisions the sandbox** (installs pnpm, the `typescript-lsp` and `context7` plugins, and opens network access for the `grep`/`context7` MCPs and the DHIS2 dev instance). That first `pnpm sbx:mount`/`sbx:clone` takes a minute longer; later runs reuse it.
```

- [ ] **Step 2: Replace the trailing MCP note with the in-sandbox tooling summary**

Find this line near the end of the section:

```markdown
Not all host MCP servers are available inside a sandbox — only project-level configuration in the repo is picked up.
```

Replace it with:

````markdown
**Tooling inside the sandbox:** the `typescript-lsp` and `context7` plugins, the `grep` MCP, and the prettier/eslint format hook all work. Only project-level config (committed `.claude/`) is picked up — user-level MCP servers are not. **GitHub auth (`gh`) is deliberately not available inside sandboxes** — the agent has no push/PR power, so a misbehaving session can't touch your repos; do GitHub operations on the host.

**Browser automation** is not yet available in-sandbox: the image (Ubuntu 26.04 arm64) has no installable Chrome, and Playwright does not yet support that OS. Once it does, enable it with:

```bash
scripts/sbx.sh clone   # or mount
# then, inside the sandbox:
npx playwright install chromium
claude plugin install chrome-devtools-mcp@claude-plugins-official
# point chrome-devtools-mcp at the installed binary via --executablePath
```
````

For now, inspect the running app from your host browser against the published `:3000`.

```

- [ ] **Step 3: Verify README formatting**

Run: `pnpm exec prettier --check README.md`
Expected: no warnings (run `pnpm exec prettier --write README.md` if it reports issues).

- [ ] **Step 4: Checkpoint**

Suggested commit message for the user:

```

docs: document sbx provisioning, in-sandbox tooling, and deferred browser

```

---

### Task 5: Final non-live verification

**Files:** none (verification only)

- [ ] **Step 1: Full syntax + lint pass**

Run: `bash -n scripts/sbx.sh && pnpm lint 2>&1 | tail -5`
Expected: no bash syntax errors; lint passes (ls-lint accepts the script, Prettier clean on README/package.json).

- [ ] **Step 2: Usage and guard still intact**

Run: `scripts/sbx.sh; echo "exit=$?"` then `PATH=/usr/bin:/bin scripts/sbx.sh purge; echo "exit=$?"`
Expected: usage prints with `exit=1`; the guard prints the install message with `exit=0`.

---

### Task 6: Interactive smoke test (manual — requires Docker + real auth)

Validates the live behavior that can't be automated here. Run once.

**Files:** none (verification only)

- [ ] **Step 1: Setup**

Run: `scripts/sbx.sh setup`
Expected: `sbx login`, `balanced` policy set, anthropic secret stored, context7 prompt works (skip or enter a key), and it prints the "GitHub auth intentionally not configured" line.

- [ ] **Step 2: Mount provisioning**

Run: `pnpm sbx:mount`
Expected (first run): prints "Configuring network policy…" and "Provisioning…", then attaches. Inside the session verify:
- `pnpm -v` → `11.5.2`
- `claude plugin list` → `typescript-lsp` and `context7` enabled (NOT chrome-devtools-mcp)
- ask the agent to use the `grep` and `context7` MCP tools — they respond (not blocked)
- edit a `.ts` file and confirm the PostToolUse prettier/eslint hook output appears
- `gh auth status` → reports **not** logged in (expected)

- [ ] **Step 3: Clone provisioning + DHIS2 opt-in**

Run: `pnpm sbx:clone`
Expected: provisioning runs; the DHIS2 prompt appears. Answer `y` and confirm the copy succeeds — then inside the session verify `cypress.env.json` exists at the clone's repo root and `pnpm test` runs. (If the copy lands at the wrong path, capture the clone's actual repo path with `sbx exec event-visualizer-app-clone bash -lc 'pwd; ls'` and adjust `clone_repo_path` accordingly.)

- [ ] **Step 4: Re-run is fast**

Run: `pnpm sbx:mount` again
Expected: no "Provisioning…" output (sandbox already exists); attaches immediately.

- [ ] **Step 5: Cleanup if desired**

Run: `scripts/sbx.sh purge`
Expected: both sandboxes removed.

- [ ] **Step 6: Note**

If provisioning fails on a step, capture the exact `sbx`/`claude`/`npm` error and fix `scripts/sbx.sh` — do not silently `|| true` over a real failure.
```
