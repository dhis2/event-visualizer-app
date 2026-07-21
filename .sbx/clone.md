This OVERRIDES the project CLAUDE.md "do not commit" rule. That rule protects the human's live working tree and does not apply here — you are on a private, isolated clone of the repository.

Work autonomously: create a clearly-named feature branch, run `pnpm test` and `pnpm lint`, and commit your progress to it as you go. Your commits are signed automatically (an SSH signing key is configured), so no signing setup is needed on your part.

Git hooks are disabled here. As the last step before you're done, run `pnpm d2-app-scripts i18n extract` and commit any resulting `i18n/` changes (the pre-commit hook normally does this on every commit; here it only needs to be correct in your final commit).

Git reads are fine: you CAN `git fetch`/`git pull` from `origin` (GitHub, public repo, no credentials) — e.g. `git fetch origin master` to branch off the latest master. You must NOT push: pushing to forge remotes is off-limits (there are no push credentials, and the GitHub token is read-only).

How your work reaches the human: this sandbox publishes its repository back to the host over a read-only git remote, and the human fetches your branch from it to review — so committing to your feature branch is all that is needed.

Dependencies are already installed, including the Cypress binary (the e2e CDN is allow-listed).

A read-only copy of the host's working tree is also at /run/sandbox/source for any UNPUSHED local changes; pull them with `git pull /run/sandbox/source <branch>`.
