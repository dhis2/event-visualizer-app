# SonarQube Issue Resolution Workflow

This skill provides a systematic approach to fixing SonarQube quality gate failures by fetching issues directly from the API and addressing them in priority order.

**Note**: This skill is designed for **public projects only**. All DHIS2 projects on GitHub/SonarCloud are public, so this skill works perfectly for DHIS2 repositories. For private projects, authentication would be required (not covered by this skill).

## When to Use This Skill

Use this skill when:

-   A pull request fails SonarQube quality gate checks
-   You need to systematically fix code quality issues
-   You want to fetch and prioritize SonarQube issues from the API
-   You need to verify all issues are resolved before merging

**Note**: This skill will automatically detect which PR to analyze based on your current git branch. If you're on the `main` or `master` branch, you'll be asked to choose from open PRs.

## SonarQube API Access

### Fetching Issues from SonarCloud (Public Projects)

All DHIS2 projects are public and can be queried without authentication:

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=<org>_<repo>&pullRequest=<pr-number>&resolved=false&ps=100"
```

**Example for DHIS2 projects:**

After identifying the PR number (e.g., `153`), repository (`dhis2/event-visualizer-app`), and organization (`dhis2`):

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=dhis2_event-visualizer-app&pullRequest=153&resolved=false&ps=100"
```

**Key Parameters:**

-   `componentKeys`: Format is `org_repo` (e.g., `dhis2_event-visualizer-app`)
-   `pullRequest`: The PR number
-   `resolved=false`: Only show unresolved issues
-   `ps=100`: Page size (max 100 per request)
-   `statuses=OPEN,REOPENED`: Filter by status if needed

### Parsing Issues with jq

To get a readable list of issues:

```bash
curl -s "<api-url>" | jq -r '.issues[] | "\(.severity) - \(.type) - \(.message) - \(.component):\(.line)"' | sort
```

This outputs format: `SEVERITY - TYPE - MESSAGE - FILE:LINE`

### Understanding Issue Types

**Severities (Priority Order):**

1. **BLOCKER** - Must fix immediately
2. **CRITICAL** - High priority, blocks merge
3. **MAJOR** - Important issues
4. **MINOR** - Minor improvements
5. **INFO** - Informational suggestions

**Types:**

-   **BUG** - Code that is wrong or will likely fail
-   **VULNERABILITY** - Security-related issues
-   **CODE_SMELL** - Maintainability issues (non-functional)
-   **SECURITY_HOTSPOT** - Security-sensitive code to review

## Systematic Fixing Workflow

This is a **fully autonomous process** — no human interaction is needed between iterations. Run `yarn sonar` to publish results, then fetch from the branch URL to verify, and repeat until all issues are resolved.

### Step 0: Identify the PR and Branch

Before fetching issues, determine which pull request and branch to analyze:

1. **Check current git branch**:

    ```bash
    git branch --show-current
    ```

2. **Identify repository**:

    ```bash
    git remote -v | head -1
    ```

    Extract the organization and repository name (e.g., `dhis2/event-visualizer-app`).

3. **Find matching PR**:

    - If on a feature branch, use GitHub MCP tools (`mcp__github__list_pull_requests`) to find open PRs
    - Match the current branch name to a PR's `head.ref` field
    - Extract the PR number from the matching PR

4. **Handle main/master branch**:

    - If on `main` or `master` branch, list all open PRs
    - Present the list to the user and ask which PR to work on
    - Example format:

        ```
        Found 3 open PRs:
        - PR #153: feat: sidebar group cards and toggle collapse all button [DHIS2-20773/20772]
        - PR #155: refactor: implement new Layout design
        - PR #156: chore(deps-dev): bump the dependencies group

        Which PR would you like to fix SonarQube issues for?
        ```

5. **Store key information**:
    - Organization (e.g., `dhis2`)
    - Repository (e.g., `event-visualizer-app`)
    - PR number (e.g., `153`)
    - Branch name (e.g., `feat/update-buttons`) — needed for the branch API URL

This information is needed to construct the SonarQube API URLs:

-   PR issues: `componentKeys=<org>_<repo>&pullRequest=<pr-number>`
-   Branch issues (after `yarn sonar`): `componentKeys=<org>_<repo>&branch=<branch-name>`

### Step 1: Fetch and Analyze

1. **Fetch all issues** using the PR API command
2. **Parse and categorize** by severity and type using jq
3. **Create a todo list** with all issues using the TodoWrite tool

### Step 2: Fix Issues in Priority Order

Fix issues in this order:

1. **BLOCKER** and **CRITICAL** issues first (any type)
2. **BUGs** before CODE_SMELLs
3. **Group similar issues** together (same rule, same file)
4. **High severity** before low severity within each type

For each issue:

-   Read the file to understand context
-   Understand what SonarQube is complaining about
-   Apply the fix following project conventions
-   Mark todo as completed immediately after fixing

### Step 3: Test and Lint

After fixing a batch of related issues (3-5 fixes):

1. Run tests: `yarn test`
2. Run linter: `yarn lint`
3. Fix any breaking changes immediately

**Never fix all issues without testing** — you might introduce bugs!

### Step 4: Publish to SonarCloud

Run the sonar command to analyze and publish results:

```bash
yarn sonar
```

This takes several minutes to complete. Wait for it to finish before fetching results.

### Step 5: Fetch Branch Results and Verify

After `yarn sonar` completes, fetch issues using the **branch** parameter (not `pullRequest`):

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=<org>_<repo>&branch=<branch-name>&resolved=false&ps=100" \
  | jq -r '.issues[] | "\(.severity) - \(.type) - \(.rule) - \(.message) - \(.component):\(.line)"' | sort
```

Note: use URL-encoded branch names (e.g. `feat%2Fupdate-buttons` for `feat/update-buttons`).

-   If issues remain → go back to **Step 2** and continue fixing
-   If no issues remain → the process is complete

### Step 6: Process Complete

The fixing process is complete when:

-   ✅ **All todos are marked as completed**
-   ✅ **All tests pass** (`yarn test`)
-   ✅ **All linters pass** (`yarn lint`)
-   ✅ **Branch API returns zero unresolved issues**

## Key Principles

### Fix What's Reported

-   Fix only what SonarQube reports - don't refactor unnecessarily
-   Keep changes minimal and focused
-   Follow project conventions and coding style
-   Read context before changing code to avoid breaking functionality

### Test Frequently

-   Test after every 3-5 related fixes
-   Don't wait until all fixes are done
-   Catch breaking changes early

### Common Test Commands

```bash
yarn test          # Run all tests
yarn lint          # Run all linters
yarn format        # Auto-fix formatting (if needed)
```

## Tips for Efficiency

-   **Group similar issues** - fix all instances of the same rule together
-   **Use jq for parsing** - easier than parsing JSON manually
-   **Sort issues** - `| sort` makes grouping easier
-   **Track progress** - TodoWrite keeps work visible
-   **Filter by type** - add `&types=BUG` to API URL to focus on specific types

## Troubleshooting

### PR Detection Fails

-   **No matching PR found**: Check if the branch has an associated PR. Use `gh pr list` or GitHub UI to verify.
-   **Multiple PRs match**: Ask the user to specify which PR number to use.
-   **On main/master branch**: List open PRs and ask user to choose one.

### Tests Failing After Fix

-   Revert the change and understand what broke
-   Read error messages carefully
-   Check if test expectations need updating
-   Ask the user for guidance if stuck

### Issues Still Showing After `yarn sonar`

-   Re-fetch using the branch URL (not the PR URL) after `yarn sonar` completes
-   SonarCloud needs the publish step to re-analyze — results won't update without running `yarn sonar`
-   Continue with remaining issues from the branch results

## Resources

-   **SonarQube API Docs**: https://sonarcloud.io/web_api
-   **SonarQube Rules**: https://rules.sonarsource.com/
-   **DHIS2 Code Style**: Project follows `@dhis2/cli-style` conventions
