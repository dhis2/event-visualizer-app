# In-sandbox tooling for the sbx AI workspaces (Phase 2)

**Date:** 2026-06-13
**Branch:** `chore/put-claude-in-a-sandbox`
**Status:** Design — pending review
**Builds on:** `2026-06-12-sbx-ai-sandboxes-design.md` (Phase 1: the `mount`/`clone` sandboxes)

## Goal

Make the agent's tooling actually work **inside** the sandboxes, so a sandboxed session is as
capable as a host session for the everyday dev loop: the project's plugins/MCPs/LSP, the
PostToolUse formatting hook, package management, and reaching the DHIS2 dev instance.

Scope chosen by the user: "core + browser automation." Browser automation is **deferred** (see
below) because no Chrome binary runs on the current image; everything else is in scope now.

## Security posture (drives the credential decisions)

The sandboxes run with `--dangerously-skip-permissions`. Their value is _containment_ of a
no-prompt agent that may process untrusted input. Every credential injected erodes that. So:
**inject the minimum, scoped as tightly as possible.**

| Credential       | Decision           | Why                                                                                                                                                                                                                              |
| ---------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic        | **required**       | The agent is Claude; it must authenticate to run.                                                                                                                                                                                |
| GitHub / `gh`    | **not injected**   | Neither workflow needs it (clone returns commits via the host remote; the human does git/PRs). Withholding it makes "don't push to forge" **capability-enforced**, not just instructed. Public reads still work unauthenticated. |
| context7 API key | **optional**       | Low blast radius: a docs-lookup key, proxy-scoped to one host, no write power. User's call.                                                                                                                                      |
| DHIS2 creds      | **opt-in (clone)** | Needed only if the clone runs e2e/app against the test instance. Mount gets them via the bind mount. Deliberate opt-in.                                                                                                          |

`gh` is preinstalled in the image but left logged out by design.

## Verified environment (from a discovery probe, 2026-06-13)

Image `docker/sandbox-templates:claude-code-docker` = **Ubuntu 26.04, arm64**; user `agent` with
passwordless sudo; node 22 + npx + git + curl + **`jq` already present**; **`pnpm` absent**; fresh
`~/.claude` has **no marketplaces** and does **not** auto-install `enabledPlugins`. The repo
direct-mounts at its host path with `.claude/settings.json` visible, so project config applies when
`sbx run claude` starts the agent there.

The `balanced` network policy is a **default-deny egress proxy** (HTTP 403 = blocked). It already
allows: ubuntu apt mirrors, `registry.npmjs.org`, `github.com`/`api.github.com`/
`raw.githubusercontent.com`, `download.docker.com`. Everything else is blocked until allowed.

## Provisioning (run once per sandbox, at create time)

The script provisions inside the `if ! sandbox_exists` block of `cmd_mount`/`cmd_clone`, so it runs
only on first creation and persists for the sandbox's lifetime. Two parts:

**A. Network allow-rules (host-side), scoped to the sandbox:**

```bash
sbx policy allow network --sandbox "$NAME" "mcp.grep.app,context7.com,*.context7.com,$DHIS2_HOST"
```

`$DHIS2_HOST` is derived from `cypress.env.json` (`jq -r .dhis2BaseUrl`, reduced to host); skipped
if the file is absent. `mcp.grep.app` = the `grep` SSE MCP; `context7.com,*.context7.com` =
context7. (`github.com` etc. need no rule — already allowed.)

**B. In-sandbox installs (`sbx exec`):**

```bash
sbx exec "$NAME" bash -lc '
  set -e
  sudo npm i -g pnpm@'"$PNPM_VERSION"'                 # corepack is broken on this image
  claude plugin marketplace add anthropics/claude-plugins-official
  claude plugin install typescript-lsp@claude-plugins-official
  claude plugin install context7@claude-plugins-official
'
```

`$PNPM_VERSION` is read from `package.json`'s `packageManager` field (currently `11.5.2`).
`jq` is already present → no install. **`chrome-devtools-mcp` is intentionally NOT installed**
(deferred with the browser; installing it without a Chrome binary yields a broken MCP server).

**C. Clone-only — DHIS2 creds (opt-in):** after creating the clone, if the user has opted in and
`cypress.env.json` exists on the host:

```bash
sbx cp cypress.env.json "$CLONE_NAME:$REPO_ROOT/cypress.env.json"
```

## Secrets (one-time, global, in `setup`)

`setup` keeps `sbx secret set -g anthropic` and adds, with clear prompts, the **optional**
context7 key — never a github secret:

```bash
# optional; only if the user has a context7 key
sbx secret set-custom -g --host context7.com --env CONTEXT7_API_KEY --value <key>
```

`set-custom` puts a **placeholder** in the sandbox's `CONTEXT7_API_KEY`; the proxy swaps the real
value into outbound requests to `context7.com`, so the key never enters the sandbox. `setup`
prompts whether to configure it and skips if declined.

## Browser automation (deferred)

No arm64 Chrome runs on this image: apt `chromium` is a snap stub (no binary), Google Chrome is
amd64-only, puppeteer's Chrome-for-Testing is amd64-only, and Playwright **refuses
`ubuntu26.04-arm64`** (the OS is too new for PW 1.60 — the blocker is the OS _version_, not arm64;
Playwright supports `ubuntu24.04-arm64`). `chrome-devtools-mcp` itself needs no Playwright — any
CDP Chrome works (`--browserUrl`/`--executablePath`).

Decision: **wait** for Playwright to add Ubuntu 26.04 support (a recent LTS; likely a near-term
release), then `playwright install chromium` works on the stock image with no rework. The README
will document the future opt-in recipe (`playwright install chromium`, then install
`chrome-devtools-mcp` and point it at the binary via `--executablePath`). Rejected alternatives:
sandbox→host-Chrome bridge (weakens isolation, fragile, not autonomous) and a custom Ubuntu-24.04
template (real fix, but its own sub-project — only if waiting proves too slow).

## Mechanism choice

Provisioning is **script-driven** (`sbx exec` + host-side `sbx policy allow`/`sbx cp`), not an
`sbx kit`. Reasons: kits are experimental; the script already gates on first-create; and keeping it
in `scripts/sbx.sh` means one place to read and no new artifact format.

## Changes to `scripts/sbx.sh`

- Add `PNPM_VERSION` (parsed from `package.json`) and `DHIS2_HOST` (parsed from `cypress.env.json`,
  optional) near the existing config vars.
- Add a `provision_sandbox <name>` helper (parts A + B above).
- Call `provision_sandbox` inside the create blocks of `cmd_mount` and `cmd_clone`.
- `cmd_clone`: add the opt-in `sbx cp` of `cypress.env.json` (gated by an env flag/prompt, default
  off).
- `cmd_setup`: add the optional context7 `set-custom` prompt; do **not** add github.
- Provisioning output should be visible (these installs take time on first create).

## README updates

- Note that first `pnpm sbx:mount`/`sbx:clone` provisions the sandbox (pnpm, plugins, network) and
  is slower once.
- State which tooling works in-sandbox (typescript-lsp, context7, grep, the format hook) and that
  `gh`/GitHub auth is deliberately **not** available inside sandboxes.
- Document the deferred browser recipe.

## Verification (manual smoke test — needs real auth, interactive)

1. After `setup` + first `mount`, in a live session confirm: `pnpm -v` works; `claude plugin list`
   shows typescript-lsp + context7 enabled; the `grep` and `context7` MCP tools respond; the
   PostToolUse format hook runs on an edit.
2. Confirm `gh` is **not** authenticated (expected — security).
3. Clone: confirm `cypress.env.json` present only if opted in; `pnpm test` runs.

## Out of scope

- In-sandbox browser / `chrome-devtools-mcp` (deferred as above).
- GitHub/`gh` authentication inside sandboxes (deliberate).
- `sbx kit` / custom template.

## Files touched

- `scripts/sbx.sh` (provisioning, setup, config vars).
- `README.md` (provisioning note, tooling list, deferred-browser recipe).
