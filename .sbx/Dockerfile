# syntax=docker/dockerfile:1
#
# Custom sandbox image for the Claude AI sandboxes (see docs/claude-sandboxes.md).
# Extends the official Claude Code sandbox template with everything that does NOT depend
# on the repository lockfile: global dev tooling, a headless Chromium for browser
# automation, and the Claude plugins. Repo dependencies are still installed inside the
# running sandbox (they track the lockfile); this image only bakes the slow,
# repo-independent provisioning.
#
# Uses the docker-flavored template (not the minimal one) on purpose: mount mode overlays
# node_modules with a container-local copy via a privileged bind mount (needs CAP_SYS_ADMIN),
# and only this flavor is granted that capability — so a dependency the agent installs stays
# inside the sandbox and never reaches the host. Build/load is driven by `scripts/sbx.sh setup`.

FROM docker/sandbox-templates:claude-code-docker

# --- system packages (root) -------------------------------------------------
# The GTK/X libraries are the runtime deps for Cypress/Electron e2e AND headless
# Chromium — both launch real browser processes that need them.
USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        libgtk-3-0t64 libgtk2.0-0t64 libgbm1 libnotify4 libnss3 libxss1 \
        libasound2t64 libxtst6 xauth xvfb \
        libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 \
        libxkbcommon0 libatspi2.0-0t64 libxcomposite1 libxdamage1 libxfixes3 \
        libxrandr2 libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# --- global npm tooling (root) ----------------------------------------------
# The base already ships Node. pnpm: pinned to the repo's packageManager version.
# typescript-language-server + typescript: the typescript-lsp plugin shells out to them.
# @playwright/cli: the `playwright-cli` browser-automation tool (bundles its own matching
# chromium, downloaded in the agent step below).
ARG PNPM_VERSION=11.5.2
RUN npm install -g \
        "pnpm@${PNPM_VERSION}" \
        typescript \
        typescript-language-server \
        @playwright/cli \
    && npm cache clean --force

# Chromium's apt runtime deps, via @playwright/cli's bundled playwright.
RUN node "$(npm root -g)/@playwright/cli/node_modules/playwright/cli.js" install-deps chromium

# --- user-scoped provisioning (agent) ---------------------------------------
USER agent

# `playwright-cli install --skills` initializes the workspace: installs the Claude
# skill (here into /home/agent/.claude/skills → user scope, so it's available in the
# sandbox without touching the repo) and downloads the matching chromium + ffmpeg into
# /home/agent/.cache/ms-playwright. Baking the browser means no runtime download (and
# no playwright-CDN network rule).
WORKDIR /home/agent
RUN playwright-cli install --skills

# Claude plugins baked into /home/agent/.claude so they're present without a first-run
# install step. typescript-lsp (LSP diagnostics), context7 (library docs), superpowers.
ARG MARKETPLACE=anthropics/claude-plugins-official
RUN claude plugin marketplace add "${MARKETPLACE}" \
    && claude plugin install typescript-lsp@claude-plugins-official \
    && claude plugin install context7@claude-plugins-official \
    && claude plugin install superpowers@claude-plugins-official

WORKDIR /home/agent/workspace
