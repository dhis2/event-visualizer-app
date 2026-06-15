# Editor integration for the sbx mount sandbox (Phase 3)

**Date:** 2026-06-15
**Branch:** `chore/put-claude-in-a-sandbox`
**Status:** Design — pending review
**Builds on:** Phase 1 (mount/clone sandboxes) + Phase 2 (in-sandbox tooling)

## Goal

Let Claude running inside the **mount** sandbox connect to the developer's host **Neovim**
(via `coder/claudecode.nvim`), so editor integration works: Claude opening diffs in nvim, seeing
the active selection/open buffers, sharing diagnostics, and `@`-mentioning open files. The mount
sandbox already shares the live working tree via the bind mount; this adds the editor _protocol_
on top.

Scope: **mount only.** The clone is autonomous (no human editor attached), and browser/chrome
integration is explicitly **deferred** (separate, out of scope here).

## Proven foundation (from discovery, 2026-06-13/15)

- **Mechanism:** nvim + claudecode.nvim is the WebSocket **server**, binding host `127.0.0.1:<port>`,
  and writes `~/.claude/ide/<port>.lock` (port = filename) containing: `authToken` (32 hex),
  `workspaceFolders` (absolute paths), `transport: "ws"`, `ideName: "Neovim"`, `pid`. Claude is the
  **client**: it scans `~/.claude/ide/*.lock` and connects to `ws://127.0.0.1:<port>` with header
  `x-claude-code-ide-authorization: <token>`. There is **no env var to override the host** — Claude
  always dials `127.0.0.1:<port>`.
- **Workspace match is free:** the host lock's `workspaceFolders` is `/Users/hendrik/Apps/event-visualizer-app`,
  exactly the path the mount sandbox uses, so Claude's workspace lines up with nvim's.
- **Sandbox → host loopback is reachable** (verified): `host.docker.internal` resolves to the host
  and sbx forwards it to the host's `127.0.0.1` (confirmed against a 127.0.0.1-only host listener),
  gated by a policy allow on `localhost`. So nvim's loopback WS is reachable as-is — **no nvim patch
  and no host-side relay needed.**

## The three pieces

Because Claude hard-dials `127.0.0.1:<port>` inside the sandbox (its own loopback), three things
must be set up, per session:

1. **Lock file** copied into the sandbox at `/home/agent/.claude/ide/<port>.lock` (the sandbox HOME
   is `/home/agent`, not the host home), carrying the port + auth token Claude needs.
2. **Forwarder** inside the sandbox: listen on `127.0.0.1:<port>` and forward to
   `host.docker.internal:<port>`, so Claude's loopback dial reaches the host nvim. Same port number
   on both sides (no rewriting).
3. **Network policy** (scoped to the mount sandbox): allow `localhost:<port>` and
   `host.docker.internal` so the forwarder's outbound hop isn't blocked by default-deny.

Then, in the attached session, the developer runs `/ide` (Claude scans the synced lock and
connects). nvim validates the auth token from the lock.

## Security posture

Consistent with the project's "minimal, tightly-scoped" stance:

- The allow rule is **port-scoped** — `localhost:<nvim-port>`, not broad `localhost`. That exposes
  only the single editor WebSocket port (which rotates per nvim session), **not** every host
  loopback service. _(Open item: confirm port-scoped `localhost:<port>` allow works; only broad
  `localhost` was tested. If port scoping isn't supported, fall back to broad `localhost` only with
  an explicit opt-in, since that widens the hole.)_
- The editor WS is **token-authenticated** (32-hex token in the lock) and editor-protocol-scoped —
  a much smaller blast radius than an unauthenticated CDP/browser port.
- This is opt-in and best-effort: if no matching host lock exists (nvim not running), nothing is
  wired and isolation is unchanged.

## Design

A best-effort `ide_link` step runs inside `cmd_mount`, just before attaching:

1. On the host, scan `~/.claude/ide/*.lock`; pick the lock whose `workspaceFolders` contains
   `$REPO_ROOT` (newest if several). If none, log "no host editor detected — skipping IDE link"
   and continue (no wiring).
2. Extract `<port>` (from the filename).
3. `sbx policy allow network --sandbox <mount> "localhost:<port>,host.docker.internal"`.
4. Copy the lock into the sandbox: `sbx cp <lock> <mount>:/home/agent/.claude/ide/<port>.lock`
   (creating `~/.claude/ide` first via `sbx exec` if needed).
5. Start the forwarder detached: `sbx exec -d <mount> python3 -c '<tcp forward 127.0.0.1:port -> host.docker.internal:port>'`.
6. Print: "Editor link ready — run `/ide` in the session to connect to Neovim."
7. Attach (`sbx run …`) as today.

**Trigger:** folded into `cmd_mount` (best-effort, automatic). A `SBX_NO_IDE=1` env var disables it
for users who don't want it. Rationale: the wiring is per-session and must be live while the
session runs, so a separate command is awkward; auto-on-mount is seamless and safely no-ops when
nvim isn't present.

**Forwarder implementation:** plain `python3` (already in the image — no `socat`/apt install). A
small stdlib TCP forwarder (asyncio or threaded `socket`) bound to `127.0.0.1:<port>`, forwarding
to `host.docker.internal:<port>`. Started detached so it lives for the session; harmless leftovers
from a prior port are ignored (new port each nvim session).

**Per-session lifecycle:** nvim's port + token rotate per nvim run, so the link is re-established on
each `pnpm sbx:mount`. If the developer restarts nvim mid-session, re-running mount refreshes it.

## Open items to verify (live smoke test — needs nvim running + Anthropic auth)

1. Port-scoped `localhost:<port>` allow actually permits the forwarder (vs. needing broad `localhost`).
2. End-to-end: with nvim + claudecode.nvim running on the host, `pnpm sbx:mount` wires the link and
   `/ide` in the session connects (diffs open in nvim, selection/diagnostics flow).
3. The forwarder survives the session and Claude authenticates with the synced token.

## Out of scope

- Clone sandbox editor integration (autonomous; no editor).
- Browser/chrome integration (deferred — see project notes).
- Patching claudecode.nvim or changing its bind address (not needed).

## Files touched

- `scripts/sbx.sh` — `ide_link` helper (host lock discovery, policy, lock copy, forwarder) +
  best-effort call in `cmd_mount`; honor `SBX_NO_IDE`.
- `README.md` — document editor integration: prerequisites (nvim + claudecode.nvim running), that
  mount auto-links and you run `/ide`, the per-session nature, and `SBX_NO_IDE`.
