These are the human's LIVE working files, bind-mounted from the host; your edits appear immediately in their editor. Run tests and builds directly: `pnpm test`, `pnpm lint`, `pnpm start`.

DO NOT branch or commit — the human reviews your diffs and commits on the host.

`node_modules` is a container-local overlay (for speed). A host `pnpm install` while this session is live can drop it and wedge the sandbox — commands start failing with missing modules, wrong-platform native-binary errors (e.g. esbuild), or `getcwd` / `No such file or directory (deleted)` / working-directory errors. You cannot fix this from inside the sandbox; do not keep retrying. Tell the human to exit the session and re-run `pnpm sbx:mount -- --continue`, which detects a wedged sandbox and restarts it.
