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

**4. Run setup:**

```bash
./scripts/sbx.sh setup
```

This logs in to Docker, sets the default network policy, **builds the sandbox image**, and stores your secrets: the required GitHub PAT, an optional Anthropic key (subscription users sign in via OAuth on first mount instead), an optional `context7` key, and — if `SONAR_TOKEN` is exported on the host — a SonarCloud token. Setup fails with guidance if the PAT or signing key is missing.

## Mount sandbox — hands-on, live files (`pnpm sbx:mount`)

The agent edits your live working tree (changes show up in your editor immediately) and can run tests/build inside the sandbox, with no permission prompts but a constrained network. You review diffs and commit on the host. The agent's dev server stays inside the sandbox (it drives it there with `playwright-cli`); to view the app yourself, run `pnpm start` on the host against the same live files.

> **node_modules isolation:** on every mount the script overlays `node_modules` with a container-local directory (`sudo mount --bind` of `/home/agent/nm` over the repo's `node_modules`) and runs `pnpm install` into it — so everything the agent installs stays inside the sandbox and your host `node_modules` is never touched. This is **mandatory**: if the overlay can't be established the mount **aborts** rather than falling back to the host-backed `node_modules`. The overlay also keeps tests/builds fast: reading `node_modules` (~80k tiny files) over the macOS↔Linux file share is much slower, so the native-filesystem copy avoids that. The install runs on first mount (a few minutes; reused while the lockfile is unchanged); reconnecting with `pnpm sbx:mount` re-establishes the overlay if the sandbox was restarted. Changed dependencies while the sandbox is up? `./scripts/sbx.sh refresh-deps`.

> **Avoid `pnpm install` on the host while a mount session is live — it can wedge the sandbox.** A host install recreates `node_modules` out from under the overlay's bind mount, which poisons the container's working directory; the sandbox then fails every command with `getcwd` / missing-module errors. **Recovery:** exit the session and re-run `pnpm sbx:mount` — it detects a wedged sandbox and restarts it (add `-- --continue` to resume the conversation; no purge needed). This is inherent to overlaying `node_modules` on the shared tree — so prefer changing host dependencies when no mount session is running, then let the next mount pick them up (or use `./scripts/sbx.sh refresh-deps` from within a healthy session).

> **Editor integration (mount only):** the sandbox mounts your live editor-lock dir (`~/.claude/ide`) **read-only** — it sees your editor's current Claude Code lock but can't disturb it, so it never interferes with your host editor. The mechanism is the editor-agnostic Claude Code IDE-lock protocol, so in principle it works with any editor that integrates with Claude Code — Neovim via [`coder/claudecode.nvim`](https://github.com/coder/claudecode.nvim), VS Code, JetBrains — though it has only been **tested with Neovim**. If your editor is running on this repo when you mount, `pnpm sbx:mount` opens a **port-scoped** path to its WebSocket and starts a forwarder; run `/ide` in the session to connect (diffs, selection, diagnostics). Only this repo's editor port is opened — not general host access. Re-run `pnpm sbx:mount` if you start/restart the editor after mounting. The whole editor-link is best-effort: every step is time-bounded and retried, so if `sbx` is unresponsive it prints a notice and the sandbox still comes up — it never blocks the mount. Clone mode has no editor integration by design (it's autonomous).

## Clone sandbox — autonomous (`pnpm sbx:clone`)

The agent works on a private, isolated clone: it branches, runs tests, and commits on its own. Its commits are **signed** with the dedicated SSH signing key. Your host `node_modules` is never touched — the clone runs its own `pnpm install`.

The clone skips the pre-commit hook (`RUN_PRE_COMMIT_HOOK=0`): the per-edit format hook plus the agent's "run `pnpm test`/`pnpm lint` before finishing" instruction already cover lint/types/tests. The commit-msg hook still runs — the agent doesn't otherwise validate messages against the project's commitlint config — and pre-push never fires since the clone can't push. The agent is told to run `pnpm d2-app-scripts i18n extract` as its last step, the one thing the pre-commit hook does that nothing else covers.

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

## Planning and reviewing plans

Prefer the **superpowers** skills for planning (`superpowers:brainstorming` → `superpowers:writing-plans`) — name the skill in your prompt to trigger it reliably. Superpowers writes its spec/plan into `docs/superpowers/` **in the repo**, so the mount surfaces them in your editor live and the clone commits them for `git fetch` review. Remove those files before opening the PR unless you want to keep them.

Native plan mode is fine for quick, scoped checks, but it saves plan files to `~/.claude/plans` **inside the VM**, which is otherwise invisible on the host. So each sandbox symlinks that dir onto a per-sandbox host directory, `~/.claude/sbx-plans/<sandbox-name>/`, bind-mounted in at create — open that folder on the host to read native plan files as the agent writes them. It's keyed by sandbox name, so a mount and a clone running at once never clash.

## Browser automation

Both sandboxes use the **Playwright agent CLI** (`playwright-cli`), baked into the image along with a matching headless Chromium (no runtime download). The agent drives it with commands like `playwright-cli open http://localhost:3000`, `playwright-cli snapshot`, `click`, `fill`, and `screenshot`; the installed Playwright skill documents common flows. Start the dev server first, then point it at `http://localhost:3000`. There is no `chrome-devtools` MCP in the sandbox.

## GitHub (read-only)

`gh` works inside the sandbox for reads (`gh pr list`, `gh pr view`, `gh api …`) at the authenticated rate limit, using the read-only PAT from setup. The token is injected by the `sbx` proxy on outbound GitHub requests and never enters the sandbox — the sandbox environment only holds a placeholder. Writes (creating/merging PRs, pushing) fail server-side because the token is read-only.

## SonarQube skill

The `sonarqube-fix` skill (`pnpm sonar`) depends on `SONAR_TOKEN` the same way it does on the host. If you export `SONAR_TOKEN` on the host before `setup`, it's stored as a proxy-injected placeholder (never exposed inside the sandbox) so the skill works in the sandbox just as it would on your host.

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

Outbound network uses the `balanced` default-deny egress policy plus a shared allowlist in [`.sbx/network-allowlist.txt`](../.sbx/network-allowlist.txt) (one host/pattern per line; this repo's DHIS2 instance host is added automatically). Edit that file to grant the sandbox access to another host, then recreate the sandbox. The restriction is defense-in-depth against data exfiltration — a session can read the repo, credentials, and memory, so limiting where it can send them matters.

Only the `.sbx/Dockerfile` is baked into the image — after changing it, run `./scripts/sbx.sh rebuild`. The instructions (`.sbx/*.md`), the allowlist, and the forwarder are read at runtime, so changes to them need no rebuild. Either way, recreate the sandbox (`./scripts/sbx.sh purge`, then mount/clone) to pick up the changes.
