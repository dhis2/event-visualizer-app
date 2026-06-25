# Claude AI sandboxes (opt-in)

Two optional, isolated AI workspaces built on [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) (`sbx`). They are fully opt-in — if you do not install `sbx`, nothing here affects you.

> **Highly experimental.** The design _should_ work on macOS, Linux, and Windows (via WSL) hosts, and with any IDE that integrates with Claude Code — but it has only been **tested on a macOS / Apple Silicon (arm64) host with Neovim**. The `node_modules` overlay is a macOS-only perf workaround (skipped on Linux, where bind mounts are already fast), and `supportedArchitectures` installs the current host's binaries plus the container's. Intel Macs are not supported. Because the whole feature is opt-in, none of this affects anyone who doesn't run `sbx`. Expect rough edges off the tested path; reports/fixes welcome.

## One-time setup

Install the `sbx` CLI — on macOS via Homebrew (`brew install sbx`); see the [Docker Sandboxes docs](https://docs.docker.com/ai/sandboxes/) for other platforms. Then:

```bash
./scripts/sbx.sh setup   # Docker login, network policy, Anthropic credential
```

## Mount sandbox — hands-on, live files (`pnpm sbx:mount`)

The agent edits your live working tree (changes show up in your editor immediately) and can run tests/build inside the sandbox, with no permission prompts but a constrained network. You review diffs and commit on the host. A dev server the agent starts is published to `http://localhost:3000`.

> **node_modules note:** `pnpm-workspace.yaml` declares `supportedArchitectures` for both macOS and Linux arm64, so a single host `pnpm install` lays down the native binaries (`esbuild`/`vite`, `vitest`/rolldown, `rollup`) for **both** platforms. The same `node_modules` therefore runs natively on your host _and_ inside the Linux sandbox — no in-sandbox `pnpm install`, no swapping binaries back. (Don't run `pnpm install` in the mount: it isn't needed — dependencies come from the host.)
>
> The repo is bind-mounted, and reading `node_modules` (76k tiny files) over the macOS↔Linux file-sharing layer is ~5× slower for tests/build — module resolution and jsdom setup are dominated by per-file syscall latency. So on each mount, `pnpm sbx:mount` overlays `node_modules` with a copy on the sandbox's **native filesystem** (`sudo mount --bind`, container-local — your host `node_modules` is never touched). The copy is a snapshot taken on first mount (~2 min), reused while fresh, and rebuilt automatically when `pnpm-lock.yaml` changes. If you change dependencies on the host while the sandbox is up, refresh it without re-mounting via `./scripts/sbx.sh refresh-deps`. Like the editor link, it's best-effort and time-bounded — if it can't apply, tests still run (just slowly) off the bind mount.

> **Editor integration (Neovim):** the sandbox mounts your live editor-lock dir (`~/.claude/ide`), so it always sees the current [`coder/claudecode.nvim`](https://github.com/coder/claudecode.nvim) lock. If Neovim is running on this repo when you mount, `pnpm sbx:mount` opens a **port-scoped** path to the editor's WebSocket and starts a forwarder for it; run `/ide` in the session to connect (diffs, selection, diagnostics). Only this repo's editor port is opened — not general host access. Re-run `pnpm sbx:mount` if you start/restart Neovim after mounting (a new port needs a fresh allow rule). The whole editor-link is best-effort: every step is time-bounded and retried, so if `sbx` is unresponsive it prints a notice and the sandbox still comes up — it never blocks the mount.

> **Browser automation** works in the mount sandbox: `pnpm sbx:mount` installs a headless Chromium (via Playwright — the only source of an arm64 build; the image has no distro/Google Chrome for arm64) and registers a sandbox-local `chrome-devtools` MCP server pointed at it (`--executablePath … --headless --chromeArg=--no-sandbox`). The agent drives it with the `chrome-devtools` tools — start the dev server and have it navigate to `http://localhost:3000` to load and inspect the running app. It's a fully in-sandbox, isolated headless Chrome (no bridge to your host browser), registered at user scope so your committed config — which drives your _host_ Chrome — is untouched. First mount adds ~2 min for the Chromium download; the clone doesn't set this up.

> **SonarQube skill:** if you have `SONAR_TOKEN` exported on the host when you create the mount, `pnpm sbx:mount` writes it into the sandbox and allows `sonarcloud.io`, so the `sonarqube-fix` skill (`pnpm sonar`) works inside the mount. Note this is the one host credential that lives _inside_ the sandbox (sbx's proxy-injected secrets don't reach the agent without a recreate). It's set at create time — recreate the mount to pick up a rotated token.

## Clone sandbox — autonomous (`pnpm sbx:clone`)

The agent works on a private, isolated clone: it branches, runs tests, and commits on its own. Your host `node_modules` is never touched — the clone runs its own `pnpm install` on the container's native filesystem (so tests are fast, no overlay needed).

Git hooks are disabled in the clone (`HUSKY=0`): the per-edit format hook plus the agent's "run `pnpm test`/`pnpm lint` before finishing" instruction already cover lint/types/tests, and the clone never pushes — so the hooks would only gate autonomous commit-as-you-go. The agent is told to run `pnpm d2-app-scripts i18n extract` as its last step, the one thing the pre-commit hook does that nothing else covers.

The clone can **fetch/pull from GitHub** (`pnpm sbx:clone` points `origin` at HTTPS, so the public repo needs no credentials) — e.g. `git fetch origin master` to branch off the latest master without depending on your local checkout. It **cannot push** (no push credentials, by design). So you can spin up the clone from any branch and just tell the agent to branch off current `origin/master`.

### Reviewing the clone's work

The agent commits to a feature branch **inside** the clone — it does not push anywhere. To get its work onto your host for review:

1. `pnpm sbx:clone` wires up a host git remote, `sandbox-event-visualizer-app-clone`, pointing at the clone's git daemon. It is re-wired on every run (the daemon's published port changes), so fetch while the sandbox is running.
2. Fetch and inspect the agent's branch:

    ```bash
    git fetch sandbox-event-visualizer-app-clone
    git branch -r | grep sandbox-event-visualizer-app-clone        # list its branches
    git log --oneline sandbox-event-visualizer-app-clone/<branch>
    git diff master...sandbox-event-visualizer-app-clone/<branch>
    ```

3. Check it out locally to review or build on:

    ```bash
    git checkout -b review/<branch> sandbox-event-visualizer-app-clone/<branch>
    ```

4. Integrate what you want (merge, cherry-pick, or open a PR) — or just discard the branch. The remote is **fetch-only** (the sandbox serves it read-only): you pull from it, never push to it.

Unlike the mount, the clone gets a **one-way copy** of this project's memory at create (no sessions, no settings — it stays isolated). Re-push the latest host memory with `./scripts/sbx.sh sync-clone`.

> The clone runs `pnpm install` at create. Its `postinstall` runs `generate-types`, which fetches the OpenAPI spec from the DHIS2 dev instance (the provisioned network rule allows it), and the install pulls the Cypress binary too (its CDN is allow-listed), with the Electron/GTK system libs provisioned so `cypress` can actually run.

## Provisioning and forwarding

> **First run provisions the sandbox** (installs pnpm, the `typescript-lsp`, `context7`, and `superpowers` plugins, and opens network access for the `grep`/`context7` MCPs, `dhis2.org`/`*.dhis2.org`, and the Cypress binary CDN). That first `pnpm sbx:mount`/`sbx:clone` takes a minute longer; later runs reuse it.

Extra Claude flags are forwarded — pass them after `--`, e.g. `pnpm sbx:mount -- --continue` or `pnpm sbx:clone -- --model opus`.

`pnpm sbx:mount` mounts _this project's_ Claude history + memory (`~/.claude/projects/<repo>`) into the sandbox **read-write**, so `pnpm sbx:mount -- --continue` (or `--resume`) picks up your host conversation and work done in the sandbox flows back to the host. (Only this project's dir is shared — no credentials or other projects. Don't run host Claude and the sandbox on this project simultaneously; they'd write the same files.)

## Other commands

```bash
./scripts/sbx.sh refresh-deps  # rebuild the mount's native node_modules cache from the host install
./scripts/sbx.sh sync-clone    # re-copy this project's memory into the clone (host -> clone)
./scripts/sbx.sh reset-clone   # wipe the clone back to a clean checkout
./scripts/sbx.sh purge         # remove both sandboxes
```

## Tooling and constraints

**Tooling inside the sandbox:** the `typescript-lsp`, `context7`, and `superpowers` plugins, the `grep` MCP, and the prettier/eslint format hook all work. Only project-level config (committed `.claude/`) is picked up — your _host_ user-level MCP servers are not propagated in. **GitHub auth (`gh`) is deliberately not available inside sandboxes** — the agent has no push/PR power, so a misbehaving session can't touch your repos; do GitHub operations on the host.

`/doctor` shows the `chrome-devtools-mcp` plugin as "enabled in project settings but not installed" — this is **expected**: the plugin is enabled for host use (it drives the host's Chrome), can't be disabled sandbox-locally (it's enabled at project scope = the committed file), and isn't installed in the sandbox, so it loads no tools and the warning is harmless. Browser automation comes from the sandbox-local `chrome-devtools` server (see above). This goes away once Google ships Chrome for arm64 Linux and the sandbox can install it.
