# Opt-in `sbx` AI workspaces for event-visualizer-app

**Date:** 2026-06-12
**Branch:** `chore/put-claude-in-a-sandbox`
**Status:** Design — approved, pending spec review

## Goal

Give the developer two optional, project-scoped AI sandboxes built on **Docker Sandboxes
(`sbx`, v0.32.0)**, each removing permission prompts without the risk of an unsandboxed agent:

1. **mount** — hands-on, human-in-the-loop. The agent edits the developer's **live files**
   (visible in their editor immediately); the agent may run tests/build inside the sandbox; the
   **human** reviews diffs and commits. No permission prompts, but the agent's shell is
   sandboxed (constrained network egress, isolated filesystem).
2. **clone** — hands-off, autonomous. The agent works through a problem on a private in-container
   clone: branch, run tests, and commit autonomously. The developer retrieves the work via a git
   remote on the host.

The tooling must be **shared** (committed, discoverable by the team) but **fully opt-in**: a
developer without `sbx` installed, or who never runs the commands, is completely unaffected.

## What `sbx` actually is (verified)

Confirmed against the installed CLI and the Docker docs, because the originating blueprint
described the tool inaccurately:

- `sbx` runs each agent in an **isolated microVM** (its own filesystem, network, and Docker
  daemon) — not a shared container. Agent notes may honestly say "isolated microVM."
- The agent runs as a non-root user **with passwordless sudo**: "it has sudo access, and
  installed packages persist for the sandbox's lifetime." Install OS packages with `sudo apt`;
  install home-directory tools **without** sudo, or they land in `/root/` and miss the PATH.
- **Only project-level configuration in the working directory is available** inside the sandbox.
  "Sandboxes don't pick up user-level configuration from your host, such as `~/.claude`." So the
  repo's committed `.claude/settings.json` is visible; user-level MCP servers (e.g. `grep`) are
  not.
- `sbx ports <name> --publish` binds **host loopback** by default (127.0.0.1/::1).
- `--clone` mounts the host repo read-only at **`/run/sandbox/source`**; the agent's commits are
  served back to the host as a **`sandbox-<name>` git remote** (git-daemon). The agent can sync
  host changes with `git pull /run/sandbox/source <branch>`.
- A **secret proxy** (`sbx secret set …`) authenticates the agent for services without exposing
  the credential; **network policy** (`sbx policy set-default balanced`) constrains egress.

### Hard constraints discovered (shape the design)

- `sbx` mounts **whole directories only** — no individual files (`sbx create … pkg.json` fails
  with "workspace path exists but is not a directory"), no subpath exclusion, no volume/tmpfs
  overlay. Verified empirically.
- **Consequence for mount mode:** because `node_modules` sits in the repo root next to essential
  config _files_ (`package.json`, `pnpm-lock.yaml`, `tsconfig.json`, the `vite-*.config.ts`),
  there is no way to bind-mount the source live while isolating `node_modules`. Mounting the repo
  root shares `node_modules`; mounting only subdirectories loses the root config files. So the
  mount sandbox **shares `node_modules` with the host** and accepts the caveat below.

### `node_modules` caveat (mount only)

The repo is bind-mounted at its host path, so `node_modules` is one shared folder. The host's
native binaries are built for **darwin-arm64**; the microVM is **Linux**. When the agent runs
`pnpm install` in the mount sandbox to run tests, it rebuilds `node_modules` for Linux in that
shared folder.

This is acceptable because the impact is narrow:

- **Unaffected on the host:** editor IntelliSense, ESLint, Prettier, and `tsc` — all pure-JS, so
  they work regardless of which platform `node_modules` was installed for. The developer's
  hands-on loop (edit → review diff → commit) never touches `node_modules`.
- **Affected on the host:** only the genuinely native tools — `vite`/dev-server, `vitest`,
  `cypress`. During a session the **agent** runs these inside the sandbox; the developer views
  the running app via the published port.
- **The one rule:** to run the app/tests **natively on the host** (outside the sandbox), run
  `pnpm install` first. It is fast — the host pnpm store (`~/Library/pnpm/store`) stays warm —
  and `node_modules` persists in the shared folder, so the install is effectively one-time per
  switch of direction.

The **clone** sandbox has no such caveat: it installs into its own filesystem, leaving the host
`node_modules` untouched.

## Rejected from the original blueprint

- _"The runtime boundary is 100% secure → skip prompts."_ No boundary is. Prompts are skipped
  because the microVM is isolated and egress is constrained by the `balanced` policy — not a
  false absolute. The agent note says exactly this.
- Mounting `~/.ssh` / `~/.gitconfig`. Unnecessary given the secret proxy and the clone git
  remote; mounting raw keys exposes them to the agent.
- `/etc/sandbox-persistent.sh`, editor-lock-file syncing, MicroVM VNC on `:7900`,
  Playwright `--with-deps`, `.env` parsing. Fabricated or moot — this repo has no `.env` files
  and uses Cypress, not Playwright.
- A Makefile. A bash script guarded by `command -v sbx` gives the same graceful opt-out without
  introducing a build tool the team doesn't use.

## Packaging

All logic lives in a committed `scripts/sbx.sh` exposing subcommands. Two thin `package.json`
scripts wrap the common ones:

```
pnpm sbx:mount   → scripts/sbx.sh mount
pnpm sbx:clone  → scripts/sbx.sh clone
```

Less-frequent operations stay as direct subcommands (not in `package.json`):

```
scripts/sbx.sh reset-clone
scripts/sbx.sh purge
scripts/sbx.sh setup
```

**Opt-out guard:** every subcommand first checks `command -v sbx`. If absent, it prints
`Docker Sandboxes not installed — run 'brew install sbx' to use the AI sandboxes` and exits `0`.
Nothing in the repo breaks for non-users.

**Sandbox names** are prefixed with the repo folder name (`basename` of the git toplevel) to
avoid cross-project collisions: `event-visualizer-app-mount`, `event-visualizer-app-clone`.
Computed, not hardcoded.

## Subcommands

### `mount`

Hands-on work on the live working tree.

1. Guard on `sbx`.
2. If `…-mount` does not exist:
    - `sbx create claude . --name event-visualizer-app-mount` (bind-mounts the repo read-write).
    - `sbx ports event-visualizer-app-mount --publish 3000:3000` (host loopback) so the developer
      views the dev server the agent runs inside.
3. Attach with the layered note and skipped prompts:
   `sbx run event-visualizer-app-mount -- --dangerously-skip-permissions --append-system-prompt "<BASE + MOUNT>"`.

### `clone`

Autonomous background clone.

1. Guard on `sbx`.
2. If `…-clone` does not exist: `sbx create --clone claude . --name event-visualizer-app-clone`.
3. Attach:
   `sbx run event-visualizer-app-clone -- --dangerously-skip-permissions --append-system-prompt "<BASE + CLONE>"`.
4. On return, print retrieval instructions:
   `git fetch sandbox-event-visualizer-app-clone && git log sandbox-event-visualizer-app-clone/<branch>`.

### `reset-clone`

Wipe the clone's working tree, preserving installed system packages (they live in image layers):

```
sbx exec event-visualizer-app-clone bash -lc \
  'git reset --hard origin/<default-branch> && git clean -fdx'
```

`<default-branch>` is **detected** via `git symbolic-ref --short refs/remotes/origin/HEAD`
(fallback `master`) — this repo's default is `master`, not `main`.

### `purge`

`sbx rm --force event-visualizer-app-mount event-visualizer-app-clone || true`.

### `setup`

One-time guided helper; never hardcodes a secret:

1. `sbx login` (Docker sign-in).
2. `sbx policy set-default balanced` — the egress lever that makes skipping prompts reasonable.
3. `sbx secret set -g anthropic` (and optionally `github`) — read via stdin/OAuth at the prompt,
   injected by the proxy, never exposed to the agent.

## Permissions model

Both sandboxes attach with `--dangerously-skip-permissions`. Justified in the agent note as
isolation + constrained egress, not a false security claim:

- **clone** — fully isolated; host repo read-only, commits returned over a git remote.
- **mount** — live files are writable, but egress is policy-constrained and that is the point of
  the sandbox. Accepted by the developer.

## Layered agent notes

Delivered via `claude --append-system-prompt` so they are authoritative and layering is literal
string concatenation: mount gets BASE + MOUNT; clone gets BASE + CLONE.

**BASE (both):**

- You are in an isolated microVM sandbox (own filesystem, network, and Docker daemon).
- You have passwordless sudo. Install OS packages with `sudo apt` (they persist for the sandbox's
  lifetime); install home-directory tools **without** sudo so they stay on your PATH.
- Network egress is restricted by a balanced policy. Permission prompts are skipped because of
  this isolation — not because the environment is unconditionally safe.

**MOUNT layer (mount only):**

- These are the human's **live working files**, bind-mounted from the host.
- You may install dependencies and run tests/build here; `node_modules` becomes Linux-built,
  which is expected.
- **Do not branch or commit** — the human reviews your diffs and commits on the host (this
  matches the project CLAUDE.md).
- A dev server you start is reachable from the host at `localhost:3000`.

**CLONE layer (clone only):**

- **This overrides the project CLAUDE.md "do not commit" rule** — that rule protects the human's
  live working tree and does not apply here. You are on a private, isolated clone.
- Work autonomously: create a feature branch, run `pnpm test` / `pnpm lint`, and commit your
  progress. Do not push to forge remotes.
- A read-only copy of the host repo is at `/run/sandbox/source`; pull host updates with
  `git pull /run/sandbox/source <branch>`. The human collects your commits from the host's
  `sandbox-event-visualizer-app-clone` git remote.

## MCP and browser support (documented expectations)

- Only project-level MCP/plugin config in the repo is visible in the sandbox; user-level servers
  are not. None of this repo's MCPs need API-key env vars, so no secrets are passed for them.
  Plugin marketplace caches are user-level and may need re-fetching inside the sandbox; the
  README will note that not all host MCPs are available.
- Browser: the default path is to run the dev server in the sandbox, publish the port, and drive
  the developer's **host** Chrome / chrome-devtools MCP against it. For in-sandbox browser
  automation the agent can `sudo apt install` Chromium/Cypress deps on demand. Nothing is
  pre-baked.

## Packages

Let the agent install what it needs on demand (sudo for OS packages, plain `pnpm install` for
node deps). No custom template image is pre-built; that is a later optimization if startup
install time becomes a pain.

## Docs

Add a short **"AI sandboxes (opt-in)"** section to `README.md`: prerequisites
(`brew install sbx`, run `scripts/sbx.sh setup` once), the two commands (`pnpm sbx:mount`,
`pnpm sbx:clone`), the `node_modules` one-rule for mount, how to retrieve the clone's branch,
and `reset-clone` / `purge`. Per the repo's keep-docs-in-sync rule.

## Out of scope

- Makefile integration; `~/.ssh` / `~/.gitconfig` mounting.
- Playwright, VNC, custom template images; `.env` parsing.
- Editor-lock-file synchronization.
- Isolating `node_modules` in mount mode (not possible with `sbx`).

## Files touched

- `scripts/sbx.sh` (new, executable).
- `package.json` (two `scripts` entries).
- `README.md` (new opt-in section).
