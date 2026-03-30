# SonarQube Issue Resolution Workflow

Fix SonarQube quality gate failures systematically by fetching issues directly from the API and addressing them in priority order.

**Note**: Designed for **public projects only**. All DHIS2 projects on SonarCloud are public, so no authentication is required. For private projects, authentication would be needed (not covered here).

## When to Use

Use this command when:

-   A pull request fails SonarQube quality gate checks
-   You need to systematically fix code quality issues
-   You want to fetch and prioritize SonarQube issues from the API
-   You need to verify all issues are resolved before merging

The current git branch is used to detect the relevant PR automatically. If you're on `main` or `master`, you'll be asked to choose from open PRs.

## Instructions

### Step 1: Identify the PR and Branch

1. **Check current branch:**

    ```bash
    git branch --show-current
    ```

2. **Identify repository:**

    ```bash
    git remote -v | head -1
    ```

    Extract the organization and repository name (e.g. `dhis2/event-visualizer-app`).

3. **Find the matching PR:**

    - On a feature branch: use `mcp__github__list_pull_requests` to find open PRs, match `head.ref` to the current branch, and extract the PR number.
    - On `main`/`master`: list all open PRs and ask the user which one to work on:

        ```
        Found 3 open PRs:
        - PR #153: feat: sidebar group cards [DHIS2-20773]
        - PR #155: refactor: implement new Layout design
        - PR #156: chore(deps-dev): bump the dependencies group

        Which PR would you like to fix SonarQube issues for?
        ```

4. **Store for use in later steps:**
    - Organization (e.g. `dhis2`)
    - Repository (e.g. `event-visualizer-app`)
    - PR number (e.g. `153`)
    - Branch name (e.g. `feat/update-buttons`)

### Step 2: Fetch and Analyze Issues

Fetch all unresolved issues for the PR:

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=<org>_<repo>&pullRequest=<pr-number>&resolved=false&ps=100"
```

Parse into a readable list:

```bash
curl -s "<url>" | jq -r '.issues[] | "\(.severity) - \(.type) - \(.message) - \(.component):\(.line)"' | sort
```

Expected output format: `SEVERITY - TYPE - MESSAGE - FILE:LINE`

**Issue severities (fix in this order):**

1. BLOCKER
2. CRITICAL
3. MAJOR
4. MINOR
5. INFO

**Issue types:**

-   BUG — code that is wrong or will likely fail
-   VULNERABILITY — security-related issues
-   CODE_SMELL — maintainability issues
-   SECURITY_HOTSPOT — security-sensitive code to review

**CRITICAL: Create a todo list** using the TodoWrite tool with all issues before starting any fixes. This keeps progress visible.

### Step 3: Fix Issues in Priority Order

Fix in this order:

1. BLOCKER and CRITICAL issues first (any type)
2. BUGs before CODE_SMELLs
3. Group by rule and file — fix all instances of the same rule together
4. High severity before low severity within each type

For each issue:

-   Read the file to understand context
-   Understand what SonarQube is flagging and why
-   Apply a minimal, focused fix following project conventions
-   Mark the todo item as completed immediately after fixing

### Step 4: Test and Lint After Each Batch

**CRITICAL: After every 3–5 related fixes**, run:

```bash
yarn test   # Run all unit tests
yarn lint   # Run all linters
```

Fix any regressions immediately before continuing. Never accumulate fixes without testing — you might introduce bugs that are hard to trace later.

### Step 5: Publish to SonarCloud

Once a batch of fixes is complete and tests pass:

```bash
yarn sonar
```

This takes several minutes. Wait for it to finish before fetching results.

### Step 6: Fetch Branch Results and Verify

After `yarn sonar` completes, verify using the **branch** parameter (not `pullRequest`):

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=<org>_<repo>&branch=<branch-name>&resolved=false&ps=100" \
  | jq -r '.issues[] | "\(.severity) - \(.type) - \(.rule) - \(.message) - \(.component):\(.line)"' | sort
```

Note: URL-encode the branch name (e.g. `feat%2Fupdate-buttons` for `feat/update-buttons`).

-   Issues remain → return to Step 3 and continue fixing
-   No issues → process is complete

### Step 7: Completion Criteria

The process is complete when all of the following are true:

-   ✅ All todos are marked as completed
-   ✅ All tests pass (`yarn test`)
-   ✅ All linters pass (`yarn lint`)
-   ✅ Branch API returns zero unresolved issues

## Examples

### Example 1: Feature branch with failing quality gate

```
User: /sonarqube-fix

1. Branch is `feat/update-buttons` → mcp__github__list_pull_requests finds PR #153
2. Fetch issues: 2 MAJOR CODE_SMELLs, 1 MINOR BUG
3. Create todos for all 3 issues
4. Fix MINOR BUG first (it's a BUG), then the two CODE_SMELLs
5. After fixes: yarn test && yarn lint → passes
6. yarn sonar → publishes results
7. Branch API → 0 issues remaining ✅
```

### Example 2: On main branch, multiple open PRs

```
User: /sonarqube-fix

1. Branch is `main` → list open PRs, ask user to choose
2. User selects PR #155
3. Fetch issues for PR #155
4. Proceed with workflow as normal
```

## Key Principles

**Fix only what SonarQube reports** — don't refactor surrounding code, clean up style, or make improvements beyond the reported issues. Keep changes minimal and focused.

**Test frequently** — after every batch of 3–5 related fixes, not at the end. Catch regressions early.

**Group similar issues** — fixing all instances of the same rule together is faster and reduces context switching.

## Troubleshooting

### PR detection fails

-   **No matching PR**: Check that the branch has an open PR. Use `gh pr list` or the GitHub UI.
-   **Multiple PRs match**: Ask the user to specify the PR number explicitly.
-   **On main/master**: List all open PRs and let the user choose.

### Tests fail after a fix

-   Revert the change and re-read the error carefully
-   Check if test expectations need updating alongside the fix
-   Ask the user for guidance if the root cause is unclear

### Issues still showing after `yarn sonar`

-   Always re-fetch using the **branch** URL (not the PR URL) after `yarn sonar`
-   SonarCloud only updates after the publish step — results won't change without running `yarn sonar`
-   Continue working through remaining issues from the branch results

### MCP connection issues

-   Verify the github MCP server is connected (check `.claude/settings.json`)
-   Confirm `GITHUB_API_KEY` environment variable is set and valid
-   Test by calling `mcp__github__list_pull_requests` directly without the skill

## Resources

-   SonarQube API docs: https://sonarcloud.io/web_api
-   SonarQube rules: https://rules.sonarsource.com/
-   DHIS2 code style: project follows `@dhis2/cli-style` conventions
