# OpenCode Project Guidelines

## Project Overview

This is a DHIS2 Event Visualizer application built with React, TypeScript, Vite, Redux Toolkit, and DHIS2 UI components.

## Tech Stack

-   **Framework**: React 18 with TypeScript
-   **Build tool**: Vite with DHIS2 app scripts
-   **State management**: Redux Toolkit with typed hooks
-   **UI components**: DHIS2 UI (@dhis2/ui), DND Kit for drag-and-drop
-   **Testing**: Vitest (unit), Cypress (component & e2e)
-   **Styling**: CSS modules with TypeScript plugin
-   **Linting**: ESLint with DHIS2 cli-style config
-   **Formatting**: Prettier with DHIS2 config

## DHIS2 App Shell Structure

This is a DHIS2 "App Shell App", which has a special build structure:

### .d2 Directory

-   **Location**: `.d2/shell/` contains generated files for the App Shell
-   **Purpose**: Files in `.d2/shell/src/` are duplicates of the main `src/` directory but wrapped in the DHIS2 AppShell
-   **AppShell Context**: Components in `.d2/` have access to additional React Contexts provided by DHIS2 (authentication, data engine, etc.)
-   **IMPORTANT**: **Never write or modify files in `.d2/` directory** - they are generated automatically during build
-   **Editing**: Always edit files in the main `src/` directory, changes will be reflected in `.d2/` during rebuild

### Generated TypeScript Types

-   **Location**: `src/types/dhis2-openapi-schemas/`
-   **Contents**: Auto-generated TypeScript types from DHIS2 OpenAPI specifications
-   **Files**: `generated.ts` (main types) and `index.ts` (exports)
-   **Usage**: Import types from `@types` alias, not directly from this directory
-   **Regeneration**: Types are regenerated from OpenAPI specs, do not edit manually

### Build Process

1. Source code in `src/` is the primary development location
2. During build, files are copied to `.d2/shell/` and wrapped with AppShell
3. AppShell provides DHIS2-specific contexts and runtime
4. Generated types provide TypeScript definitions for DHIS2 API

## Code Conventions

### TypeScript & Imports

-   Use TypeScript strict mode (enabled in tsconfig)
-   Always use path aliases (`@hooks`, `@components`, `@api/*`, etc.) - never use relative parent imports (`../`)
-   Use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports`)
-   Never use default exports (`import/no-default-export` error)
-   **Generated types** are in `src/types/dhis2-openapi-schemas/` (**DO NOT EDIT**) - import from `@types` alias instead

### React Components

-   Use functional components with hooks
-   DHIS2 app-runtime hooks (`useDataQuery`, `useDataMutation`) are restricted - use RTK hooks from `src/hooks` instead
-   React Redux hooks are restricted - use typed hooks from `src/hooks` (`useAppDispatch`, `useAppSelector`)
-   Keep components focused and small
-   Use CSS modules for styling

### State Management

-   Use Redux Toolkit slices in `src/store/`
-   Use typed hooks from `src/hooks` for Redux access
-   Follow RTK best practices for async logic (createAsyncThunk or RTK Query)

### Testing

-   **Unit tests**: Use Vitest with Testing Library
    -   Import testing utilities from 'vitest', not global
    -   Test files: `*.spec.ts` or `*.spec.tsx`
    -   Location: co-located with source or in `__tests__` directories
-   **Component tests**: Cypress Component Testing
    -   Files: `*.cy.tsx`
    -   Use `@testing-library/cypress` commands
-   **E2E tests**: Cypress
    -   Files: `*.cy.ts`
    -   Use `@dhis2/cypress-commands` for DHIS2-specific commands

### File Structure

-   `src/api/` - API clients and services
-   `src/assets/` - Static assets
-   `src/components/` - React components
-   `src/constants/` - Constants and configuration
-   `src/hooks/` - Custom React hooks
-   `src/modules/` - Feature modules
-   `src/store/` - Redux store and slices
-   `src/test-utils/` - Testing utilities
-   `src/types/` - TypeScript type definitions
    -   `src/types/dhis2-openapi-schemas/` - **GENERATED** DHIS2 OpenAPI types (do not edit)
-   `.d2/` - **GENERATED** App Shell build directory (do not edit)
    -   `.d2/shell/` - App Shell wrapped version of `src/` with DHIS2 contexts

### MCP Servers Available

-   **GitHub**: Interact with repositories, issues, PRs
-   **Grep by Vercel**: Search code across GitHub
-   **Context7**: Search documentation
-   **NeoVim**: Integration with NeoVim editor
-   **ESLint**: Lint JavaScript/TypeScript code

### Linting & Formatting

-   ESLint config extends `@dhis2/cli-style`
-   Prettier config uses DHIS2 defaults
-   Stylelint for CSS/SCSS
-   Run `yarn lint` and `yarn format` before committing

### Git & Commits

-   Follow conventional commits
-   Use feature branches
-   PRs should include tests for new functionality
-   Keep commits focused and atomic

### Security

-   Never commit secrets (use environment variables)
-   Validate all user input
-   Use DHIS2 authentication and authorization patterns

### Performance

-   Lazy load heavy components with React.lazy
-   Optimize re-renders with memo/useCallback when needed
-   Use Redux selectors efficiently
-   Bundle splitting via Vite dynamic imports
