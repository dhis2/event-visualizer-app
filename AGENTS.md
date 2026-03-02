# Event Visualizer App - OpenCode Agent Guidelines

## Project Overview

This is a DHIS2 Event Visualizer application built with React, TypeScript, Vite, Redux Toolkit, and DHIS2 UI components. The application provides event data visualization capabilities within the DHIS2 ecosystem.

### Tech Stack

-   **Framework**: React 18 with TypeScript (strict mode)
-   **Build Tool**: Vite with DHIS2 Application Platform (v12.10.2)
-   **State Management**: Redux Toolkit with typed hooks
-   **UI Components**: DHIS2 UI (@dhis2/ui), DND Kit for drag-and-drop
-   **Testing**: Vitest (unit tests) + Cypress (component & E2E tests)
-   **Styling**: CSS modules with TypeScript plugin, styled components
-   **Linting/Formatting**: ESLint, Prettier, Stylelint via `@dhis2/cli-style`
-   **i18n**: DHIS2 i18n utilities for internationalization

## DHIS2 App Shell Structure

This is a DHIS2 "App Shell App" with a special build structure:

### .d2 Directory (GENERATED - DO NOT EDIT)

-   **Location**: `.d2/shell/` contains generated files for the App Shell
-   **Purpose**: Files in `.d2/shell/src/` are duplicates of the main `src/` directory but wrapped in the DHIS2 AppShell
-   **AppShell Context**: Components in `.d2/` have access to additional React Contexts provided by DHIS2 (authentication, data engine, etc.)
-   **IMPORTANT**: **Never write or modify files in `.d2/` directory** - they are generated automatically during build
-   **Editing**: Always edit files in the main `src/` directory, changes will be reflected in `.d2/` during rebuild

### Generated TypeScript Types (DO NOT EDIT)

-   **Location**: `src/types/dhis2-openapi-schemas/`
-   **Contents**: Auto-generated TypeScript types from DHIS2 OpenAPI specifications
-   **Files**: `generated.ts` (main types) and `index.ts` (exports)
-   **Usage**: Import types from `@types` alias, not directly from this directory
-   **Regeneration**: Run `yarn generate-types` to regenerate from OpenAPI specs
-   **DO NOT**: Edit these files manually - they will be overwritten

### Build Process

1. Source code in `src/` is the primary development location
2. During build, files are copied to `.d2/shell/` and wrapped with AppShell
3. AppShell provides DHIS2-specific contexts and runtime
4. Generated types provide TypeScript definitions for DHIS2 API

## Project Structure

```
src/                   # Source code (primary development location)
  ├── api/             # API clients and services
  ├── assets/          # Static assets
  ├── components/      # React components
  ├── constants/       # Constants and configuration
  ├── hooks/           # Custom React hooks (including typed Redux hooks)
  ├── modules/         # Feature modules
  ├── store/           # Redux store and slices
  ├── test-utils/      # Testing utilities
  ├── types/           # TypeScript type definitions
  │   └── dhis2-openapi-schemas/  # GENERATED - Do not edit
  └── ...
.d2/                   # GENERATED App Shell directory - Do not edit
  └── shell/           # App Shell wrapped version with DHIS2 contexts
cypress/               # E2E and component tests
scripts/               # Build and utility scripts
i18n/                  # Internationalization files
types/                 # Additional auto-generated DHIS2 API types
```

## Development Workflow

### Running the App

```bash
yarn start          # Development server on http://localhost:3000
yarn build          # Production build
yarn deploy         # Deploy to DHIS2 instance
```

### Testing

```bash
yarn test           # Run unit tests (vitest)
yarn test:watch     # Run tests in watch mode
yarn cy:open        # Open Cypress E2E GUI
yarn cy:run         # Run E2E tests headless
yarn cy:comp:open   # Open Cypress component testing
yarn cy:comp:run    # Run component tests headless
```

### Code Quality

```bash
yarn lint           # Check for lint errors
yarn format         # Fix/format code violations
```

### Type Generation

```bash
yarn generate-types # Regenerate DHIS2 API types from OpenAPI specs
```

## Code Conventions

### TypeScript & Imports

-   **Strict mode**: TypeScript strict mode is enabled in tsconfig
-   **Path aliases**: Always use path aliases (`@hooks`, `@components`, `@api/*`, `@types`) - **never use relative parent imports** (`../`)
-   **Type imports**: Use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports`)
-   **No default exports**: Never use default exports (`import/no-default-export` error)
-   **Generated types**: Import from `@types` alias, not directly from `src/types/dhis2-openapi-schemas/`
-   **No `any`**: Avoid `any` unless absolutely necessary - use proper typing

### React Components

-   **Functional components**: Use functional components with hooks
-   **Restricted hooks**:
    -   DHIS2 app-runtime hooks (`useDataQuery`, `useDataMutation`) are restricted - use RTK hooks from `src/hooks` instead
    -   React Redux hooks are restricted - use typed hooks from `src/hooks` (`useAppDispatch`, `useAppSelector`)
-   **DHIS2 UI components**: Use DHIS2 UI components where possible for consistency
-   **Component size**: Keep components focused and small
-   **Styling**: Use CSS modules for styling

### State Management

-   **Redux Toolkit**: Use Redux Toolkit slices in `src/store/`
-   **Typed hooks**: Use typed hooks from `src/hooks` for Redux access (`useAppDispatch`, `useAppSelector`)
-   **Async logic**: Follow RTK best practices for async logic (createAsyncThunk or RTK Query)
-   **Custom hooks**: Extract reusable logic into custom hooks (see `src/hooks/`)

### Naming Conventions

-   **Components**: PascalCase (`EventChart.tsx`)
-   **Hooks**: camelCase with `use` prefix (`useEventData.ts`)
-   **Types**: PascalCase (`EventDataItem`)
-   **Files**: kebab-case for utilities, PascalCase for components
-   **CSS Modules**: kebab-case (e.g., `event-chart.module.css`)

### Testing Guidelines

#### Unit Tests (Vitest)

-   **Files**: `*.spec.ts` or `*.spec.tsx`
-   **Location**: Co-located with source or in `__tests__` directories
-   **Import**: Import testing utilities from 'vitest', not global
-   **Testing Library**: Use `@testing-library/react` for component testing
-   **Coverage**: Write tests for utilities and complex logic
-   **Mocking**: Mock DHIS2 API calls appropriately

#### Component Tests (Cypress)

-   **Files**: `*.cy.tsx`
-   **Commands**: Use `@testing-library/cypress` commands
-   **Purpose**: Test component behavior in isolation

#### E2E Tests (Cypress)

-   **Files**: `*.cy.ts`
-   **Commands**: Use `@dhis2/cypress-commands` for DHIS2-specific commands
-   **Purpose**: Test critical user flows
-   **Environment**: Test against DHIS2 instances (see `cypress.env.json`)

## DHIS2-Specific Considerations

-   **App runtime hooks**: Use DHIS2 app runtime hooks (`useDataQuery`, `useDataMutation`, `useConfig`, etc.) through RTK wrappers
-   **Design system**: Follow DHIS2 design system and patterns
-   **Internationalization**: Use DHIS2 i18n utilities for all user-facing strings
-   **Testing environments**: Test against DHIS2 instances (development and production)
-   **Authentication**: Handle DHIS2 authentication and authorization properly
-   **Deployment**: App can be deployed as both a standalone app and a plugin

## Important Configuration Files

-   `package.json` - Dependencies and scripts
-   `tsconfig.json` - TypeScript configuration (strict mode enabled)
-   `vite.config.ts` / `vite-extensions.config.mts` - Vite build configuration
-   `cypress.config.ts` - Cypress E2E configuration
-   `cypress.env.json` - Cypress environment (gitignored, see template)
-   `.eslintrc.js` - ESLint rules (extends `@dhis2/cli-style`)
-   `.prettierrc.js` - Prettier formatting rules (DHIS2 config)
-   `.stylelintrc.js` - Stylelint CSS/SCSS rules
-   `d2.config.js` - DHIS2 app configuration

## MCP Servers Enabled for This Project

The following Model Context Protocol servers are enabled for this project (see `opencode.json`):

-   **GitHub** (`github_*`): Interact with repositories, issues, PRs, search code
    -   Create/update issues and PRs
    -   Search repositories, files, and code
    -   Manage branches and commits
-   **Grep by Vercel** (`grep_*`): Fast code search across GitHub repositories
    -   Search code patterns across multiple repos
    -   Find usage examples
    -   **Usage**: Add `use the grep tool` to your prompts
-   **Context7** (`context7_*`): Search technical documentation
    -   Query documentation for libraries and frameworks
    -   Find API references and examples
    -   **Usage**: Add `use context7` to your prompts
-   **NeoVim** (`neovim_*`): Integration with NeoVim editor
    -   View and edit buffers
    -   Execute vim commands
    -   Navigate and manage windows/tabs
    -   Requires NeoVim running with socket at `/tmp/nvim`

**Note**: These servers override the global configuration which disables them by default. Other DHIS2 projects may have different MCP server configurations.

**How to use MCP servers**: Add `use <server-name>` or `use the <server-name> tool` to your prompts. For example:

-   `What's the right way to use Redux createSlice? use the grep tool`
-   `How do I configure Vite plugins? use context7`

**Linting**: For ESLint functionality, use the bash tool with `npx eslint <file-path>` instead of an MCP server.

## Git Workflow

**IMPORTANT FOR AI AGENTS**: **DO NOT stage files or create commits**. The user reviews diffs, stages changes, and commits. Your role is to modify code files only - all git operations (staging, committing, pushing) are the user's responsibility.

### Git Hooks

Pre-commit hooks are configured via Husky to:

-   Run linters (ESLint, Prettier, Stylelint)
-   Enforce commit message conventions (conventional commits)
-   Run type checking

### Commit Guidelines

-   **Format**: Follow conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
-   **Branches**: Use feature branches for development
-   **PRs**: Pull requests should include tests for new functionality
-   **Atomicity**: Keep commits focused and atomic
-   **Testing**: Run tests before committing (`yarn test`, `yarn lint`)

## Security Best Practices

-   **Secrets**: Never commit secrets, API keys, or credentials (use environment variables)
-   **Input validation**: Validate and sanitize all user input
-   **DHIS2 patterns**: Use DHIS2 authentication and authorization patterns
-   **Dependencies**: Keep dependencies updated to address security vulnerabilities

## Performance Best Practices

-   **Code splitting**: Lazy load heavy components with `React.lazy` and dynamic imports
-   **Optimization**: Use `memo`, `useCallback`, `useMemo` when needed to optimize re-renders
-   **Selectors**: Use Redux selectors efficiently
-   **Bundle optimization**: Leverage Vite's bundle splitting via dynamic imports
-   **DHIS2 API**: Optimize DHIS2 API requests (pagination, field filtering, caching)

## Additional Notes

-   **Generated files**: Files in `.d2/` and `src/types/dhis2-openapi-schemas/` are auto-generated - **do not edit manually**
-   **Cypress environment**: `cypress.env.json` is gitignored - use `cypress.env.template.json` as a reference
-   **Dual deployment**: The app can be deployed as both a standalone app and a plugin
-   **Path aliases**: Always prefer path aliases over relative imports for better maintainability
-   **DHIS2 platform**: Leverage DHIS2 Platform capabilities and conventions throughout development

## Testing & Linting Workflow for AI Agents

**Golden Rule**: When building a solution, test and lint **specific files only**. When finishing, always run **full project validation** with `yarn test` and `yarn lint`.

### During Development (File-Specific Commands)

Use these commands when actively working on code to get fast feedback:

#### Testing Individual Files

```bash
npx vitest run <file-path>
# Example: npx vitest run src/hooks/useEventData.spec.ts
```

#### Linting Individual Files

**TypeScript Checking**

**Primary: Use LSP Diagnostics** - OpenCode's built-in LSP integration shows TypeScript errors when files are read or edited. This is the fastest method with full project context (path aliases, type checking).

**Fallback: Project-wide CLI** - File-specific TypeScript checking is **not possible** due to project references and path aliases. Use:

```bash
./scripts/check-typescript.sh
# Or directly:
npx tsc --project tsconfig.json --noEmit --skipLibCheck
npx tsc --project cypress/tsconfig.json --noEmit --skipLibCheck
```

**Rationale**: Project has path aliases and references requiring full project context.

**ESLint Checking**

**Primary: File-specific CLI** - Use CLI commands for reliable, complete linting:

```bash
npx eslint <file-path>                    # Check only
npx eslint <file-path> --fix              # Fix automatically
```

**Secondary: LSP Diagnostics** - NeoVim LSP may show ESLint errors, but OpenCode's LSP integration may filter them. CLI commands are more reliable.

**Rationale**: CLI commands are more reliable and complete than LSP for ESLint.

**Stylelint Checking**

**Primary: File-specific CLI** - Always use CLI commands:

```bash
npx stylelint <file-path> --max-warnings=0         # Check only
npx stylelint <file-path> --fix --max-warnings=0   # Fix automatically
```

**Rationale**: CLI commands ensure consistent and complete Stylelint checking.

**Prettier Formatting**

**Primary: File-specific CLI**:

```bash
npx prettier --check <file-path>          # Check formatting
npx prettier --write <file-path>          # Format automatically
```

**Rationale**: CLI commands ensure consistent formatting.

**File Type Specific Instructions**:

**TypeScript/TSX files** (`.ts`, `.tsx`):

-   **TypeScript**: LSP diagnostics (automatic when reading/editing)
-   **ESLint**: Use file-specific CLI commands
-   **Prettier**: Use file-specific CLI commands

**CSS/SCSS files** (`.css`):

-   **Stylelint**: Use file-specific CLI commands
-   **Prettier**: Use file-specific CLI commands

**Other formats** (`.json`, `.md`, `.yml`, `.yaml`):

-   **Prettier**: Use file-specific CLI commands

### After Completing Work (Project-Wide Commands)

**Always run these before finishing**:

```bash
yarn test          # Run all unit tests (vitest)
yarn lint          # Run all linters (ESLint, Stylelint, Prettier, TypeScript, ls-lint)
```

If there are failures, many can be fixed automatically using `yarn format`:

```bash
yarn format        # Auto-fix formatting and auto-fixable lint issues
```

After running `yarn format`, run `yarn lint` again to verify all issues are resolved. Note that `yarn format` can resolve:

-   Prettier formatting issues (indentation, spacing, quotes, etc.)
-   Auto-fixable ESLint issues (marked with wrench 🔧 icon in ESLint output)
-   Auto-fixable Stylelint issues

Some errors require manual fixes (e.g., type errors, logic issues, certain lint violations).

**Note on TypeScript**: The project has two TypeScript configurations:

-   `tsconfig.json` - Main configuration for src files with path aliases
-   `cypress/tsconfig.json` - Configuration for Cypress tests

The `yarn lint` command checks both configurations. Individual file TypeScript checking via `npx tsc` is not recommended as it lacks the full project context (path aliases, project references). Use `./scripts/check-typescript.sh` or LSP diagnostics instead.

### Decision Tree

**While working on a solution**:

-   Modified 1-3 files → Use file-specific `npx` commands for each file
-   Need to fix formatting → Use `npx prettier --write <file-path>` or `npx eslint <file-path> --fix`
-   Modified many files → Use `yarn lint` and `yarn test`

**When finishing a task**:

-   Always run `yarn test` (ensures all tests pass)
-   Always run `yarn lint` (ensures code quality across project)
-   If lint fails with formatting issues → Run `yarn format` then `yarn lint` again

### Common Pitfalls to Avoid

-   ❌ **Don't** run `yarn test` and `yarn lint` after every small change (wastes time)
-   ❌ **Don't** use `npx eslint .` when you only changed one file
-   ❌ **Don't** forget to run full `yarn test` and `yarn lint` when finishing
-   ✅ **Do** prefer LSP diagnostics for TypeScript checking (fastest with full context)
-   ✅ **Do** use file-specific CLI commands for ESLint and Stylelint (more reliable than LSP)
-   ✅ **Do** run project-wide commands as final validation
-   ✅ **Do** use `npx prettier --write` to quickly fix formatting issues
