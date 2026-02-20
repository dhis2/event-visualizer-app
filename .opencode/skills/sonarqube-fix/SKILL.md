---
name: sonarqube-fix
description: Fix SonarQube quality gate issues systematically using the API
license: MIT
compatibility: opencode
metadata:
    audience: developers
    workflow: code-quality
---

# SonarQube Issue Resolution Workflow

This skill provides a systematic approach to fixing SonarQube quality gate failures by fetching issues directly from the API and addressing them in priority order.

**Note**: This skill is designed for **public projects only**. All DHIS2 projects on GitHub/SonarCloud are public, so this skill works perfectly for DHIS2 repositories. For private projects, authentication would be required (not covered by this skill).

## When to Use This Skill

Use this skill when:

-   A pull request fails SonarQube quality gate checks
-   You need to systematically fix code quality issues
-   You want to fetch and prioritize SonarQube issues from the API
-   You need to verify all issues are resolved before merging

## SonarQube API Access

### Fetching Issues from SonarCloud (Public Projects)

All DHIS2 projects are public and can be queried without authentication:

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=<org>_<repo>&pullRequest=<pr-number>&resolved=false&ps=100"
```

**Example for DHIS2 projects:**

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

This is an **iterative, human-in-the-loop process**. The user will commit and push changes, then ask you to refetch and continue if issues remain.

### Step 1: Fetch and Analyze

1. **Fetch all issues** using the API command
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

### Step 3: Test Regularly

After fixing a batch of related issues (3-5 fixes):

1. Run tests: `yarn test`
2. Run linter: `yarn lint`
3. Fix any breaking changes immediately

**Never fix all issues without testing** - you might introduce bugs!

### Step 4: Process Complete

The fixing process is complete when:

-   ✅ **All todos are marked as completed**
-   ✅ **All tests pass** (`yarn test`)
-   ✅ **All linters pass** (`yarn lint`)

**Note**: The user will commit and push the changes. If SonarQube still reports issues after the push, the user will ask you to refetch and continue fixing.

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

### Tests Failing After Fix

-   Revert the change and understand what broke
-   Read error messages carefully
-   Check if test expectations need updating
-   Ask the user for guidance if stuck

### Issues Still Showing After Push

-   User will refetch and provide updated issue list
-   SonarQube needs time to re-analyze after push
-   Continue with remaining issues

## Resources

-   **SonarQube API Docs**: https://sonarcloud.io/web_api
-   **SonarQube Rules**: https://rules.sonarsource.com/
-   **DHIS2 Code Style**: Project follows `@dhis2/cli-style` conventions
