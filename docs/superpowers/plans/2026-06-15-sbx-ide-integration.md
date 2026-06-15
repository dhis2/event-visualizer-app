# sbx Editor Integration (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-link the mount sandbox's Claude to the host's Neovim (claudecode.nvim) so `/ide` connects: sync the host lock into the sandbox, run an in-sandbox TCP forwarder to the host's loopback, and add a port-scoped network allow.

**Architecture:** A best-effort `ide_link` step in `cmd_mount` discovers the host `~/.claude/ide/*.lock` matching this repo, opens `localhost:<port>` to the sandbox, copies the lock into the sandbox's `~/.claude/ide/`, and starts a `python3` forwarder (`127.0.0.1:<port>` → `host.docker.internal:<port>`) because Claude hard-dials loopback. No-ops if nvim isn't running or `SBX_NO_IDE=1`.

**Tech Stack:** Bash, Docker Sandboxes (`sbx`), python3 (in the image), node (host, for lock parsing).

**Spec:** `docs/superpowers/specs/2026-06-15-sbx-ide-integration-design.md`

**Repo conventions:**

- **The agent does NOT stage or commit** unless the user says so. Each task ends at a verified checkpoint with a suggested commit message.
- `scripts/sbx.sh` is bash — verify with `bash -n` (not auto-formatted by hooks).
- The riskiest piece (the forwarder's hop to `host.docker.internal`, and port-scoped allow) is validated **non-live** in Task 3. Full `/ide` connectivity needs nvim + Anthropic auth → Task 6 (manual).

**Starting point:** `scripts/sbx.sh` has the Phase 1+2 content: config vars, `require_sbx`/`sandbox_exists`/`default_branch`/`dhis2_host`/`provision_sandbox`/`maybe_inject_dhis2_creds`, the note heredocs, `cmd_mount`/`cmd_clone`/`cmd_reset_clone`/`cmd_purge`/`cmd_setup`, and the `case` dispatch.

---

### Task 1: Add the forwarder, host-lock discovery, and `ide_link` helper

**Files:**

- Modify: `scripts/sbx.sh`

- [ ] **Step 1: Add the forwarder heredoc after the existing note heredocs (after `CLONE_NOTE`'s `EOF`)**

```bash
read -r -d '' IDE_FORWARDER_PY <<'PYEOF' || true
import sys, socket, threading

port = int(sys.argv[1])

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
    try:
        upstream = socket.create_connection(("host.docker.internal", port))
    except OSError:
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
```

- [ ] **Step 2: Add `host_ide_lock` and `ide_link` helpers directly above `cmd_mount()`**

```bash
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
```

- [ ] **Step 3: Syntax check**

Run: `bash -n scripts/sbx.sh`
Expected: no output, exit 0.

- [ ] **Step 4: Unit-check `host_ide_lock` on the host**

Run: `bash -c 'source <(sed "/^case /,\$d" scripts/sbx.sh); host_ide_lock; echo'`
Expected: prints `<port> <path-to-lock>` if a Neovim lock for this repo exists in `~/.claude/ide/` (there are stale ones from prior sessions), or an empty line if none. Either is fine — it must not error.

- [ ] **Step 5: Checkpoint**

Suggested commit message:

```
feat: add sbx editor-link helper (host lock discovery + loopback forwarder)
```

---

### Task 2: Wire `ide_link` into `cmd_mount`

**Files:**

- Modify: `scripts/sbx.sh`

- [ ] **Step 1: Call `ide_link` before attaching in `cmd_mount`**

Locate in `cmd_mount`:

```bash
    local note="${BASE_NOTE}"$'\n\n'"${MOUNT_NOTE}"
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "$note"
}
```

Replace with:

```bash
    ide_link "$MOUNT_NAME"
    local note="${BASE_NOTE}"$'\n\n'"${MOUNT_NOTE}"
    sbx run "$MOUNT_NAME" -- \
        --dangerously-skip-permissions \
        --append-system-prompt "$note"
}
```

Note: `ide_link` runs on **every** `cmd_mount` (outside the `if ! sandbox_exists` block), not just first create — the nvim port/token rotate per session, so the link must refresh each attach.

- [ ] **Step 2: Syntax check**

Run: `bash -n scripts/sbx.sh`
Expected: no output, exit 0.

- [ ] **Step 3: Verify the wiring and the disable flag path**

Run: `grep -nE 'ide_link "\$MOUNT_NAME"|SBX_NO_IDE' scripts/sbx.sh`
Expected: `ide_link "$MOUNT_NAME"` is called in `cmd_mount`; `SBX_NO_IDE` guard present in `ide_link`.

- [ ] **Step 4: Checkpoint**

Suggested commit message:

```
feat: auto-link host editor on sbx mount (best-effort, SBX_NO_IDE to disable)
```

---

### Task 3: Non-live verification of the forwarder + port-scoped allow

This validates the riskiest mechanics without needing nvim or Anthropic auth, by standing in a plain HTTP listener for nvim's WS server. **If any step fails, fix `scripts/sbx.sh` before continuing** (the most likely failure is the forwarder's `host.docker.internal` hop resolving to a link-local IPv6 without a scope — if so, adjust the python to iterate `socket.getaddrinfo(...)` results and connect to the first that succeeds).

**Files:** none (verification only)

- [ ] **Step 1: Start a host loopback listener** (stand-in for nvim's WS)

Run (background): `cd /tmp && echo "ide-forward-reached-host" > /tmp/sbxide.html && python3 -m http.server 38099 --bind 127.0.0.1 --directory /tmp`
Expected: serving on 127.0.0.1:38099. Confirm on host: `curl -s http://127.0.0.1:38099/sbxide.html` → `ide-forward-reached-host`.

- [ ] **Step 2: Create a probe sandbox and apply a port-scoped allow**

Run:

```bash
cd /Users/hendrik/Apps/event-visualizer-app
sbx create claude "$PWD" --name evt-ideprobe
sbx policy allow network --sandbox evt-ideprobe "localhost:38099,host.docker.internal"
```

Expected: sandbox created; rules added. (Confirms port-scoped `localhost:38099` is accepted.)

- [ ] **Step 3: Copy in and start the forwarder, then reach the host through it**

Run:

```bash
bash -c 'source <(sed "/^case /,\$d" scripts/sbx.sh); printf "%s" "$IDE_FORWARDER_PY" > /tmp/fwd.py'
sbx cp /tmp/fwd.py evt-ideprobe:/tmp/sbx-ide-forward.py
sbx exec -d evt-ideprobe python3 /tmp/sbx-ide-forward.py 38099
sbx exec evt-ideprobe bash -lc 'sleep 1; curl -sS -m 6 http://127.0.0.1:38099/sbxide.html'
```

Expected: the final command prints `ide-forward-reached-host` — i.e., the sandbox's `127.0.0.1:38099` reached the host's loopback listener through the forwarder.

- [ ] **Step 4: Confirm port scoping is real (negative check)**

Run: `sbx exec evt-ideprobe bash -lc 'curl -sS -m 6 -o /dev/null -w "%{http_code}\n" http://host.docker.internal:38080/ 2>&1 | tail -1'`
Expected: blocked/non-200 for a _different_ port (38080 was not allowed) — confirming the allow is scoped to 38099, not all of localhost.

- [ ] **Step 5: Clean up**

Run:

```bash
pkill -f "http.server 38099" 2>/dev/null || true
rm -f /tmp/sbxide.html /tmp/fwd.py
sbx rm --force evt-ideprobe
```

Expected: listener stopped, sandbox removed.

- [ ] **Step 6: Checkpoint** (no code change unless Step 3/4 forced a fix)

If a fix was needed, suggested commit message:

```
fix: make sbx ide forwarder resolve host.docker.internal robustly
```

---

### Task 4: Document editor integration in the README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add an editor-integration note in the "AI sandboxes (opt-in)" section**

After the **Mount sandbox** paragraph (and its node_modules note), insert:

```markdown
> **Editor integration (Neovim):** if you have Neovim running with [`coder/claudecode.nvim`](https://github.com/coder/claudecode.nvim) open on this repo, `pnpm sbx:mount` auto-links it — it copies the editor's lock into the sandbox, opens a port-scoped network path to the editor's WebSocket, and starts a forwarder. In the session, run `/ide` to connect (diffs, selection, diagnostics). It re-links each mount (the editor's port rotates per session); restart `pnpm sbx:mount` if you restart Neovim. Set `SBX_NO_IDE=1` to disable. Only the single editor port is opened — not general host access.
```

- [ ] **Step 2: Verify formatting**

Run: `pnpm exec prettier --check README.md`
Expected: no warnings (run `--write` if needed).

- [ ] **Step 3: Checkpoint**

Suggested commit message:

```
docs: document sbx mount editor integration
```

---

### Task 5: Final non-live verification

**Files:** none

- [ ] **Step 1: Syntax + lint**

Run: `bash -n scripts/sbx.sh && pnpm lint 2>&1 | tail -5`
Expected: no bash syntax errors; lint passes.

- [ ] **Step 2: Usage + guard intact**

Run: `scripts/sbx.sh; echo "exit=$?"` then `PATH=/usr/bin:/bin scripts/sbx.sh purge; echo "exit=$?"`
Expected: usage with `exit=1`; guard message with `exit=0`.

---

### Task 6: Interactive smoke test (manual — needs Neovim + Anthropic auth)

**Files:** none

- [ ] **Step 1: Prep**

Have Neovim open on this repo with `claudecode.nvim` active (so a `~/.claude/ide/<port>.lock` exists with `workspaceFolders` = this repo). Ensure `scripts/sbx.sh setup` has been run (Anthropic secret).

- [ ] **Step 2: Mount with auto-link**

Run: `pnpm sbx:mount`
Expected: prints `Linking host editor (Neovim, WS port <port>)...` then `Editor link ready — run /ide...`, then attaches.

- [ ] **Step 3: Connect**

In the session, run `/ide`.
Expected: Claude reports connected to Neovim. Verify: ask Claude to open a diff — it appears in nvim; selection/diagnostics flow. (If it fails, capture the `/ide` error and check: lock present at `/home/agent/.claude/ide/<port>.lock` in the sandbox, forwarder running (`sbx exec event-visualizer-app-mount bash -lc 'pgrep -af sbx-ide-forward'`), and the allow rule for `localhost:<port>`.)

- [ ] **Step 4: Disable path**

Run: `SBX_NO_IDE=1 pnpm sbx:mount`
Expected: no "Linking host editor" line; attaches normally.

- [ ] **Step 5: Note**

If `/ide` can't connect despite the forwarder reaching the host (Task 3 passed), the likely culprit is auth-token/workspace mismatch or Claude needing `CLAUDE_CODE_SSE_PORT`/`ENABLE_IDE_INTEGRATION` set at launch — capture the exact behavior before changing the approach.
