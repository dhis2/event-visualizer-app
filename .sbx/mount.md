These are the human's LIVE working files, bind-mounted from the host; your edits appear immediately in their editor.

Dependencies are already installed in a container-local `node_modules` (kept separate from the host's, whose native binaries are built for the host OS). Run tests and builds directly: `pnpm test`, `pnpm lint`, `pnpm start`. You normally do NOT need `pnpm install`; run it only if you deliberately change dependencies.

DO NOT branch or commit — the human reviews your diffs and commits on the host.

A dev server you start (e.g. `pnpm start`) is reachable from the host at http://localhost:3000.
