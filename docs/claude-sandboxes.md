# Claude AI sandboxes (opt-in)

Two optional, isolated AI workspaces built on [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) (`sbx`). They are fully opt-in — if you do not install `sbx`, nothing here affects you.

> **Highly experimental.** The design _should_ work on macOS, Linux, and Windows (via WSL) hosts, and with any IDE that integrates with Claude Code — but it has only been **tested on a macOS / Apple Silicon (arm64) host with Neovim**. Intel Macs are not supported. Because the whole feature is opt-in, none of this affects anyone who doesn't run `sbx`. Expect rough edges off the tested path; reports/fixes welcome.

## How it works

Provisioning lives in a **custom image** ([`.sbx/Dockerfile`](../.sbx/Dockerfile)) that extends the official `docker/sandbox-templates:claude-code-docker` template. It bakes in everything that doesn't depend on the repo lockfile: `pnpm`, the TypeScript language server, the `playwright-cli` browser tool with a headless Chromium, and the `typescript-lsp` / `context7` / `superpowers` Claude plugins. A thin runtime script ([`scripts/sbx.sh`](../scripts/sbx.sh)) handles only what must happen live: creating the sandbox, wiring the network policy and secrets, installing the repo's dependencies, and (for the clone) commit signing.

The `docker`-flavored template is used rather than the `minimal` one because mount mode overlays `node_modules` with a container-local copy via a privileged bind mount (`CAP_SYS_ADMIN`), and only this flavor is granted that capability — so a dependency the agent installs stays inside the sandbox and never reaches the host.

The agent's instructions are the markdown files in [`.sbx/`](../.sbx) (`base.md` plus `mount.md` or `clone.md`), concatenated and passed via `--append-system-prompt`.

## One-time setup

**1. Install the `sbx` CLI** — on macOS via Homebrew (`brew install sbx`); see the [Docker Sandboxes docs](https://docs.docker.com/ai/sandboxes/) for other platforms. Docker is also required (the image is built with `docker build`).

**2. Create a read-only GitHub token (required).** In GitHub → Settings → Developer settings → **Fine-grained tokens**, create a token with Resource owner = your account and Repository access = **"Public repositories (read-only)"** (no extra permissions needed). This lets `gh` read PRs/issues/repos inside the sandbox at the higher authenticated rate limit; writes fail server-side because the token is read-only. The token is stored via the `sbx` proxy and **never enters the sandbox** — the sandbox only sees a placeholder.

**3. Create a dedicated SSH signing key (required).** This signs the clone's commits. It is a **signing-only** key — it grants no push or auth ability:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/sbx_signing -C "sbx signing"
```

Then add the **public** key (`~/.ssh/sbx_signing.pub`) to GitHub → SSH and GPG keys → New SSH key → **Key type: Signing Key** (not Authentication). Override the path with `SBX_SIGNING_KEY` if you keep it elsewhere.

**4. (Host browser testing) enable claude-in-chrome.** For driving the running app from your _host_ Claude, use the built-in **claude-in-chrome** browser in the Claude desktop app. Terminal-only `claude` users won't have it and can add a browser tool at user scope instead. (Inside the sandboxes, browser automation is provided by `playwright-cli` — no setup needed.)

**5. Run setup:**

```bash
./scripts/sbx.sh setup
```

This logs in to Docker, sets the default network policy, **builds the sandbox image**, and stores your secrets: the required GitHub PAT, an optional Anthropic key (subscription users sign in via OAuth on first mount instead), an optional `context7` key, and — if `SONAR_TOKEN` is exported on the host — a SonarCloud token. Setup fails with guidance if the PAT or signing key is missing.

## Mount sandbox — hands-on, live files (`pnpm sbx:mount`)

The agent edits your live working tree (changes show up in your editor immediately) and can run tests/build inside the sandbox, with no permission prompts but a constrained network. You review diffs and commit on the host. A dev server the agent starts is published to `http://localhost:3000`.

> **node_modules isolation:** on every mount the script overlays `node_modules` with a container-local directory (`sudo mount --bind` of `/home/agent/nm` over the repo's `node_modules`) and runs `pnpm install` into it — so everything the agent installs stays inside the sandbox and your host `node_modules` is never touched. This is **mandatory**: if the overlay can't be established the mount **aborts** rather than falling back to the host-backed `node_modules`. The install runs on first mount (a few minutes; reused while the lockfile is unchanged), and a guarded remount in the sandbox's startup re-applies the overlay if the sandbox ever restarts. Changed dependencies while the sandbox is up? `./scripts/sbx.sh refresh-deps`.

> **Editor integration (Neovim):** the sandbox mounts your live editor-lock dir (`~/.claude/ide`), so it always sees the current [`coder/claudecode.nvim`](https://github.com/coder/claudecode.nvim) lock. If Neovim is running on this repo when you mount, `pnpm sbx:mount` opens a **port-scoped** path to the editor's WebSocket and starts a forwarder for it; run `/ide` in the session to connect (diffs, selection, diagnostics). Only this repo's editor port is opened — not general host access. Re-run `pnpm sbx:mount` if you start/restart Neovim after mounting. The whole editor-link is best-effort: every step is time-bounded and retried, so if `sbx` is unresponsive it prints a notice and the sandbox still comes up — it never blocks the mount. (Mount only.)

## Clone sandbox — autonomous (`pnpm sbx:clone`)

The agent works on a private, isolated clone: it branches, runs tests, and commits on its own. Its commits are **signed** with the dedicated SSH signing key. Your host `node_modules` is never touched — the clone runs its own `pnpm install`.

Git hooks are disabled in the clone (`HUSKY=0`): the per-edit format hook plus the agent's "run `pnpm test`/`pnpm lint` before finishing" instruction already cover lint/types/tests, and the clone never pushes — so the hooks would only gate autonomous commit-as-you-go. The agent is told to run `pnpm d2-app-scripts i18n extract` as its last step, the one thing the pre-commit hook does that nothing else covers.

The clone can **fetch/pull from GitHub** (`pnpm sbx:clone` points `origin` at HTTPS, so the public repo needs no credentials) — e.g. `git fetch origin master` to branch off the latest master. It **cannot push** (no push credentials, by design).

### Reviewing the clone's work

The agent commits to a feature branch **inside** the clone — it does not push anywhere. To get its work onto your host for review:

1. `pnpm sbx:clone` wires up a host git remote, `sandbox-event-visualizer-app-clone`, pointing at the clone's git daemon. It is re-wired on every run (the daemon's published port changes), so fetch while the sandbox is running.
2. Fetch and inspect the agent's branch:

    ```bash
    git fetch sandbox-event-visualizer-app-clone
    git branch -r | grep sandbox-event-visualizer-app-clone        # list its branches
    git log --show-signature sandbox-event-visualizer-app-clone/<branch>
    git diff master...sandbox-event-visualizer-app-clone/<branch>
    ```

3. Check it out locally to review or build on:

    ```bash
    git checkout -b review/<branch> sandbox-event-visualizer-app-clone/<branch>
    ```

4. Integrate what you want (merge, cherry-pick, or open a PR) — or just discard the branch. The remote is **fetch-only** (the sandbox serves it read-only): you pull from it, never push to it.

Unlike the mount, the clone gets a **one-way copy** of this project's memory at create (no sessions, no settings — it stays isolated). Re-push the latest host memory with `./scripts/sbx.sh sync-clone`.

> The clone runs `pnpm install` at create. Its `postinstall` runs `generate-types`, which fetches the OpenAPI spec from the DHIS2 dev instance (the provisioned network rule allows it), and the install pulls the Cypress binary too (its CDN is allow-listed), with the Electron/GTK system libs baked into the image so `cypress` can actually run.

## Browser automation

Both sandboxes use the **Playwright agent CLI** (`playwright-cli`), baked into the image along with a matching headless Chromium (no runtime download). The agent drives it with commands like `playwright-cli open http://localhost:3000`, `playwright-cli snapshot`, `click`, `fill`, and `screenshot`; the installed Playwright skill documents common flows. Start the dev server first, then point it at `http://localhost:3000`. There is no `chrome-devtools` MCP in the sandbox.

## GitHub (read-only)

`gh` works inside the sandbox for reads (`gh pr list`, `gh pr view`, `gh api …`) at the authenticated rate limit, using the read-only PAT from setup. The token is injected by the `sbx` proxy on outbound GitHub requests and never enters the sandbox — the sandbox environment only holds a placeholder. Writes (creating/merging PRs, pushing) fail server-side because the token is read-only.

## SonarQube skill

Public DHIS2 projects are readable on SonarCloud anonymously, so the `sonarqube-fix` skill (`pnpm sonar`) works in the sandbox without a token. If you export `SONAR_TOKEN` on the host before `setup`, it is stored as a proxy-injected placeholder (never exposed inside the sandbox) for higher limits.

## Other commands

```bash
./scripts/sbx.sh setup         # one-time: build image, set default policy, store secrets
./scripts/sbx.sh rebuild       # rebuild + reload the image after editing .sbx/ (secrets untouched)
./scripts/sbx.sh refresh-deps  # reinstall the mount's container-local node_modules
./scripts/sbx.sh sync-clone    # re-copy this project's memory into the clone (host -> clone)
./scripts/sbx.sh reset-clone   # wipe the clone back to a clean checkout
./scripts/sbx.sh purge         # remove both sandboxes
```

Extra Claude flags are forwarded — pass them after `--`, e.g. `pnpm sbx:mount -- --continue` or `pnpm sbx:clone -- --model opus`.

`pnpm sbx:mount` mounts _this project's_ Claude history + memory (`~/.claude/projects/<repo>`) into the sandbox **read-write**, so `pnpm sbx:mount -- --continue` (or `--resume`) picks up your host conversation and work done in the sandbox flows back. (Only this project's dir is shared — no credentials or other projects. Don't run host Claude and the sandbox on this project simultaneously; they'd write the same files.)

## Tooling and constraints

The `typescript-lsp`, `context7`, and `superpowers` plugins, the `grep` MCP, the `playwright-cli` browser tool, and the prettier/eslint format hook all work inside the sandbox. Only project-level config (committed `.claude/`) is picked up — your _host_ user-level MCP servers are not propagated in. `gh` is read-only (see above), so a misbehaving session can't push or open PRs.

After editing anything in `.sbx/` (Dockerfile or instructions), run `./scripts/sbx.sh rebuild`, then recreate the sandboxes (`./scripts/sbx.sh purge`, then mount/clone) to pick up the new image.
