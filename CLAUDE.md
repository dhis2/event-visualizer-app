# Event Visualizer App - Agent Guidelines

## Project Overview

This is a DHIS2 Event Visualizer application built with React, TypeScript, Vite, Redux Toolkit, and DHIS2 UI components. The application provides event data visualization capabilities within the DHIS2 ecosystem.

### Tech Stack

- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite with DHIS2 Application Platform (v12.10.2)
- **State Management**: Redux Toolkit with typed hooks
- **UI Components**: DHIS2 UI (@dhis2/ui), DND Kit for drag-and-drop
- **Testing**: Vitest (unit tests) + Cypress (component & E2E tests)
- **Styling**: CSS modules with TypeScript plugin, styled components
- **Linting/Formatting**: ESLint, Prettier, Stylelint via `@dhis2/cli-style`
- **i18n**: DHIS2 i18n utilities for internationalization

### Project Stage

This is an unreleased app under active development. Some defaults that suit stable codebases are loosened:

- **Refactor freely when it improves clarity or reduces tech debt**, even outside the strict scope of the current task. Scope creep is fine here.
- **Keep README and other documentation in sync with code changes**: when you change behavior, structure, or setup steps, update the relevant docs in the same change rather than waiting for an explicit ask.

## DHIS2 App Shell Structure

This is a DHIS2 "App Shell App" with a special build structure:

### .d2 Directory (GENERATED - DO NOT EDIT)

- **Location**: `.d2/shell/` contains generated files for the App Shell
- **Purpose**: Files in `.d2/shell/src/` are duplicates of the main `src/` directory but wrapped in the DHIS2 AppShell
- **AppShell Context**: Components in `.d2/` have access to additional React Contexts provided by DHIS2 (authentication, data engine, etc.)
- **IMPORTANT**: **Never write or modify files in `.d2/` directory** - they are generated automatically during build
- **Editing**: Always edit files in the main `src/` directory, changes will be reflected in `.d2/` during rebuild

### Generated TypeScript Types (DO NOT EDIT)

- **Location**: `src/types/dhis2-openapi-schemas/`
- **Contents**: Auto-generated TypeScript types from DHIS2 OpenAPI specifications
- **Files**: `generated.ts` (main types) and `index.ts` (exports)
- **Usage**: Import types from `@types` alias, not directly from this directory
- **Regeneration**: Run `pnpm generate-types` to regenerate from OpenAPI specs
- **DO NOT**: Edit these files manually - they will be overwritten

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
pnpm start          # Development server on http://localhost:3000
pnpm build          # Production build
pnpm deploy         # Deploy to DHIS2 instance
```

### Testing

```bash
pnpm test           # Run unit tests (vitest)
pnpm test:watch     # Run tests in watch mode
pnpm cy:open        # Open Cypress E2E GUI
pnpm cy:run         # Run E2E tests headless
pnpm cy:comp:open   # Open Cypress component testing
pnpm cy:comp:run    # Run component tests headless
```

### Code Quality

```bash
pnpm lint           # Check for lint errors
pnpm format         # Fix/format code violations
```

### Type Generation

```bash
pnpm generate-types # Regenerate DHIS2 API types from OpenAPI specs
```

## Code Conventions

### Code Style

- **Self-documenting code over comments**: Prefer well-named intermediate variables and
  small helpers over explanatory comments. If a block needs a comment to explain what it
  does, first ask whether extracting a named variable or function would make the comment
  unnecessary.
- **When to comment**: Only for (a) domain/business context that can't be inferred from the
  code, or (b) code that is genuinely hard to comprehend on its own. Never write a comment
  that restates what the next line does.
- **Never include time-bound information**: No references to previous implementations,
  refactor history, future plans, removed alternatives, or comparisons to other helpers that
  may move/disappear. Comments describe what's there and why — not how the code evolved.
- **Multi-line comments always use `/* */`**. Never stack multiple `//` lines for a block
  comment.
- **JSDoc**: Reserve for public API surfaces that genuinely benefit from a brief description.

### TypeScript & Imports

- **Strict mode**: TypeScript strict mode is enabled in tsconfig
- **Path aliases**: Always use path aliases (`@hooks`, `@components`, `@api/*`, `@types`) - **never use relative parent imports** (`../`)
- **Type imports**: Use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports`)
- **No default exports**: Never use default exports (`import/no-default-export` error)
- **Generated types**: Import from `@types` alias, not directly from `src/types/dhis2-openapi-schemas/`
- **No `any`**: Avoid `any` unless absolutely necessary - use proper typing

### React Components

- **Functional components**: Use functional components with hooks
- **Restricted hooks**:
    - DHIS2 app-runtime hooks (`useDataQuery`, `useDataMutation`) are restricted - use RTK hooks from `src/hooks` instead
    - React Redux hooks are restricted - use typed hooks from `src/hooks` (`useAppDispatch`, `useAppSelector`)
- **DHIS2 UI components**: Use DHIS2 UI components where possible for consistency
- **Component size**: Keep components focused and small
- **Styling**: Use CSS modules for styling

### State Management

- **Redux Toolkit**: Use Redux Toolkit slices in `src/store/`
- **Typed hooks**: Use typed hooks from `src/hooks` for Redux access (`useAppDispatch`, `useAppSelector`)
- **Async logic**: Follow RTK best practices for async logic (createAsyncThunk or RTK Query)
- **Custom hooks**: Extract reusable logic into custom hooks (see `src/hooks/`)

### Naming Conventions

- **Components**: PascalCase (`EventChart.tsx`)
- **Hooks**: camelCase with `use` prefix (`useEventData.ts`)
- **Types**: PascalCase (`EventDataItem`)
- **Files**: kebab-case for utilities, PascalCase for components
- **CSS Modules**: kebab-case (e.g., `event-chart.module.css`)

### Testing Guidelines

- **Test behavior, not implementation details**: assert on what callers observe, not on private state, internal call sequences, or how a result was produced.
- **Cover new functionality**: when adding or changing logic, add tests in the same change — including edge cases and error conditions, not just the happy path.

#### Unit Tests (Vitest)

- **Files**: `*.spec.ts` or `*.spec.tsx`
- **Location**: Co-located with source or in `__tests__` directories
- **Import**: Import testing utilities from 'vitest', not global
- **Testing Library**: Use `@testing-library/react` for component testing
- **Coverage**: Write tests for utilities and complex logic
- **Mocking**: Mock DHIS2 API calls appropriately

#### Component Tests (Cypress)

- **Files**: `*.cy.tsx`
- **Commands**: Use `@testing-library/cypress` commands
- **Purpose**: Test component behavior in isolation

#### E2E Tests (Cypress)

- **Files**: `*.cy.ts`
- **Commands**: Use `@dhis2/cypress-commands` for DHIS2-specific commands
- **Purpose**: Test critical user flows
- **Environment**: Test against DHIS2 instances (see `cypress.env.json`)

#### Testing Hooks with Timing Dependencies (Debounce, setTimeout, etc.)

**When to use fake timers:**

Use fake timers when you need to:

1. **Make assertions at specific points in time** - When testing debounce logic, loading states, or other time-dependent behavior
2. **Skip waiting for long timeouts** - When tests involve waiting for delays (e.g., API calls, debounce periods) and you want to advance time programmatically

Common scenarios:

- Hook tests with debounce logic (e.g., `useDebounceValue`)
- Tests with `setTimeout`, `setInterval`, or other timing-based logic
- Tests that would otherwise use `waitFor()` with long timeouts

**How to use fake timers in hook tests:**

**Key Principle**: **Avoid `waitFor()`** - Testing Library's `waitFor()` uses real timers internally and conflicts with fake timers.

1. **DO NOT use `renderHookWithAppWrapper`** - It uses `waitFor()` internally which conflicts with fake timers
2. **Choose the right test wrapper based on dependencies**:
    - **If the hook uses Redux**: Use `renderHookWithReduxStoreProvider` with a real store created via `setupStore()`
    - **If the hook doesn't use Redux**: Use `renderHook()` directly or create a minimal wrapper without `waitFor()`
    - **If the hook needs other contexts**: Create a custom wrapper that doesn't use `waitFor()`
3. **Enable fake timers** in `beforeEach()` and restore in `afterEach()`
4. **Control time** with `vi.advanceTimersByTimeAsync(ms)` instead of `waitFor()`

**Example with Redux:**

```typescript
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'

describe('useMyHook', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('debounces the API call', async () => {
        const store = setupStore(
            { mySlice: mySliceReducer },
            { mySlice: { someState: 'value' } }
        )

        const { result } = renderHookWithReduxStoreProvider(
            () => useMyHook(),
            store
        )

        // Trigger action
        act(() => {
            store.dispatch(someAction())
        })

        // Advance timers to complete debounce + API call
        await act(() => vi.advanceTimersByTimeAsync(300 + apiDelay))

        // Assert
        expect(result.current.data).toBeDefined()
    })
})
```

**Example without Redux (unit test):**

```typescript
import { renderHook } from '@testing-library/react'

describe('useMyUtilityHook', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('delays execution', async () => {
        const { result } = renderHook(() => useMyUtilityHook())

        // Trigger effect
        act(() => {
            result.current.triggerDelay()
        })

        // Advance timers
        await act(() => vi.advanceTimersByTimeAsync(1000))

        // Assert delayed behavior
        expect(result.current.isComplete).toBe(true)
    })
})
```

**Reference:** See `use-dimension-list.spec.ts` for a comprehensive example with 41 hook tests using fake timers (runs in 82ms vs 11.26s with real timers). Also see `use-delayed-is-loading-more.spec.ts` for a simpler example testing a custom hook with debounce-like timing behavior.

## DHIS2-Specific Considerations

- **App runtime hooks**: Use DHIS2 app runtime hooks (`useDataQuery`, `useDataMutation`, `useConfig`, etc.) through RTK wrappers
- **Design system**: Follow DHIS2 design system and patterns
- **Internationalization**: Use DHIS2 i18n utilities for all user-facing strings
- **Testing environments**: Test against DHIS2 instances (development and production)
- **Authentication**: Handle DHIS2 authentication and authorization properly
- **Browser testing with Chrome DevTools**: When using the Chrome DevTools plugin to test the running app, read `cypress.env.json` (gitignored) for the DHIS2 server URL and login credentials. The dev server on `localhost:3000` shows a login form requiring Server, Username, and Password
- **Deployment**: App can be deployed as both a standalone app and a plugin

## Understanding the DHIS2 Web API

AI models frequently hallucinate DHIS2 API details — endpoint paths, query parameters, response
shapes, and filter syntax all evolve between versions. Do not rely on training data for DHIS2 API
specifics. Instead, consult the actual API of the target instance using the approaches below.

Read `cypress.env.json` (gitignored) for the DHIS2 server URL and credentials. Use these for all
API interactions described in this section.

### Tier 1: OpenAPI spec (endpoint structure, parameters, types)

Fetch the scoped OpenAPI spec for the endpoint you need. The DHIS2 API supports path-filtered
specs so you get only the relevant section:

```bash
curl -u <user>:<pass> "<server>/api/openapi.yaml?path=/<resource>"
```

Examples:

- `/api/openapi.yaml?path=/analytics` — analytics endpoints
- `/api/openapi.yaml?path=/trackedEntities` — tracker endpoints
- `/api/openapi.yaml?path=/organisationUnits` — org unit endpoints

This gives you endpoint paths, HTTP methods, query parameters, and request/response schemas —
accurate for the exact server version. Use this as the first step when working with any DHIS2
API endpoint.

### Tier 2: Probe the live API (verify actual response shapes)

When the OpenAPI spec doesn't fully answer the question — especially for complex endpoints like
`/api/analytics` where responses vary based on query parameters — make GET requests against the
dev instance to see actual data:

```bash
curl -u <user>:<pass> "<server>/api/<resource>?<params>"
```

**Rules:**

- **GET requests only** — never POST, PUT, PATCH, or DELETE against the instance
- **Use the dev/test instance** from `cypress.env.json`, never a production server
- **Limit response size** — use `pageSize=1` or `pageSize=5` and `fields=` filtering to avoid
  flooding context with large responses

This is useful for understanding actual response shapes, testing filter syntax, verifying which
fields are returned, and exploring dimension/analytics data structures.

### Tier 3: Read the DHIS2 backend source (controller logic)

When you need to understand _how_ the API works — filter combination logic, validation rules,
side effects, or behavior not captured in specs — read the Java source code of the DHIS2 backend.

```bash
npx opensrc dhis2/dhis2-core --modify
```

This clones the DHIS2 backend source into `./opensrc/repos/github.com/dhis2/dhis2-core/`.
The directory is gitignored. Controllers are in `dhis-2/dhis-web-api/`, DTOs and models in
`dhis-2/dhis-api/`. Search for the controller class (e.g. `AnalyticsController`,
`OrganisationUnitController`).

If the user specifies a DHIS2 version, target that branch: `npx opensrc dhis2/dhis2-core#2.41 --modify`.

Use an Explore subagent to search the cloned source — the codebase is large and reading Java
inline floods context. The subagent can extract the API contract and return a compact summary.

## Important Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode enabled)
- `vite.config.ts` / `vite-extensions.config.mts` - Vite build configuration
- `cypress.config.ts` - Cypress E2E configuration
- `cypress.env.json` - Cypress environment (gitignored, see template)
- `.eslintrc.js` - ESLint rules (extends `@dhis2/cli-style`)
- `.prettierrc.js` - Prettier formatting rules (DHIS2 config)
- `.stylelintrc.js` - Stylelint CSS/SCSS rules
- `d2.config.js` - DHIS2 app configuration

## Plugins and MCP Servers

The following are enabled for this project via `.claude/settings.json`:

### Plugins (marketplace)

- **TypeScript LSP** (`typescript-lsp`): Automatic TypeScript diagnostics after file edits with full project context. See [Claude Code Setup in README](#) for per-developer installation.
- **Chrome DevTools** (`chrome-devtools-mcp`): Browser automation, screenshots, network inspection, console reading. When testing the running app, read `cypress.env.json` for DHIS2 server URL and login credentials.
- **Context7** (`context7`): Library and framework documentation search. **Usage**: Use proactively when answering questions about specific library/framework APIs; otherwise trigger with `use context7`.

### MCP Servers (manual)

- **Grep by Vercel** (`grep_*`): Fast code search across GitHub repositories. **Usage**: Trigger-based only — add `use the grep tool` to your prompts when you want cross-repo search.

**GitHub**: Use the `gh` CLI via Bash for all GitHub operations (issues, PRs, code search, actions). Requires the [GitHub CLI](https://cli.github.com/) to be installed and authenticated (`gh auth login`).

**Linting**: ESLint, Stylelint, and Prettier are run automatically via PostToolUse hooks. For manual checks, use `pnpm exec eslint <file-path>`.

## Git Workflow

**IMPORTANT FOR AI AGENTS**: **DO NOT stage files or create commits**. The user reviews diffs, stages changes, and commits. Your role is to modify code files only - all git operations (staging, committing, pushing) are the user's responsibility.

### Git Hooks

The project has `lint-staged` configured in `package.json` for pre-commit checks (ESLint, Prettier, Stylelint). Husky is a dependency but is not currently installed — run `npx husky install` to enable git pre-commit hooks.

### Commit Guidelines

- **Format**: Follow conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- **Branches**: Use feature branches for development
- **PRs**: Pull requests should include tests for new functionality
- **Atomicity**: Keep commits focused and atomic
- **Testing**: Run tests before committing (`pnpm test`, `pnpm lint`)

## Security Best Practices

- **Secrets**: Never commit secrets, API keys, or credentials (use environment variables)
- **Input validation**: Validate and sanitize all user input
- **DHIS2 patterns**: Use DHIS2 authentication and authorization patterns
- **Dependencies**: Keep dependencies updated to address security vulnerabilities

## Performance Best Practices

- **Code splitting**: Lazy load heavy components with `React.lazy` and dynamic imports
- **Optimization**: Use `memo`, `useCallback`, `useMemo` when needed to optimize re-renders
- **Selectors**: Use Redux selectors efficiently
- **Bundle optimization**: Leverage Vite's bundle splitting via dynamic imports
- **DHIS2 API**: Optimize DHIS2 API requests (pagination, field filtering, caching)

## Additional Notes

- **Generated files**: Files in `.d2/` and `src/types/dhis2-openapi-schemas/` are auto-generated - **do not edit manually**
- **Cypress environment**: `cypress.env.json` is gitignored - use `cypress.env.template.json` as a reference
- **Dual deployment**: The app can be deployed as both a standalone app and a plugin
- **Path aliases**: Always prefer path aliases over relative imports for better maintainability
- **DHIS2 platform**: Leverage DHIS2 Platform capabilities and conventions throughout development

## DHIS2 Program Dimension IDs

Dimensions in DHIS2 programs are identified by **compound IDs** — dot-separated strings that
encode program, stage, and dimension context. This system surfaces throughout the codebase: in
visualization objects, the layout, the sidebar, the Redux store (`visUiConfig` slice), and the
metadata provider. Understanding it is essential when working with any program dimension.

### Dimension types

- **Tracked entity attribute dimensions** are independent of program/stage context — they always
  have the same properties across tracked entity types and are identified by a plain (non-compound)
  ID. No special handling is needed.
- **Program dimensions** are context-dependent and use compound IDs (see below).

### Program types

- **Event programs** (`programType: 'WITHOUT_REGISTRATION'`) always have exactly one stage.
- **Tracker programs** (`WITH_REGISTRATION`) may have many stages. A bare `programId.dimensionId`
  key is ambiguous for tracker programs — prefer `stageId.dimensionId` or the fully explicit
  `programId.stageId.dimensionId` form.
- `ProgramStage` always carries a `program: { id: string }` back-reference, so the owning
  program can be resolved from a stage without a separate lookup.

### Backend vs frontend compound ID formats

The DHIS2 backend uses **different compound ID formats** across endpoints. The frontend normalizes
this inconsistency by adopting the analytics format as its canonical internal representation.

**Analytics API** (`/api/analytics/events/query/{programId}`): returns `stageId.dimensionId` in
response headers and `metaData.dimensions` keys. The program is implicit in the request URL, so
the stage is the only prefix needed to disambiguate dimensions.

**eventVisualizations API** (`/api/eventVisualizations`): uses `programId.stageId.dimensionId`
(or `programId.dimensionId`) in the persisted `columnDimensions`/`rowDimensions`/`filterDimensions`
string arrays. On the populated `columns`/`rows`/`filters` objects, `program` and `programStage`
are transient fields (not persisted) — they are resolved at read time from the qualified dimension
strings and from hydrated Hibernate associations.

**Frontend canonical form**: `stageId.dimensionId` — matching the analytics API. This is the
format used in Redux state (metadata keys, layout arrays, `visUiConfig`). The frontend chose this
format because analytics data flows continuously during rendering, while the visualization API is
only hit on save/load. The translation cost is paid once at the API boundary (see below).

### Compound ID forms (frontend canonical)

| Form                            | Example                      | When used                                                                             |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `stageId.dimensionId`           | `Zj7UnCAulEk.ou`             | EVENT/ENROLLMENT — this is the **canonical** form                                     |
| `programId.dimensionId`         | `eBAyeGv0exc.ou`             | TRACKED_ENTITY — enrollment-level dimensions (e.g. enrollment date, org unit, status) |
| `programId.stageId.dimensionId` | `eBAyeGv0exc.Zj7UnCAulEk.ou` | TRACKED_ENTITY — stage-level dimensions; collapsed to canonical on ingest             |

A repetition index `[n]` may be appended to the stage segment: `ps1[0].ou`.

The interpretation of a 2-segment ID depends on `outputType`:

- **EVENT/ENROLLMENT**: `part1.part2` → `stageId.dimensionId` (no programId)
- **TRACKED_ENTITY**: `part1.part2` → `programId.dimensionId` (no stageId)

3-segment keys (`programId.stageId.dimensionId`) are collapsed to `stageId.dimensionId` on ingest
for EVENT/ENROLLMENT via pure string manipulation (drop the first segment). For TRACKED_ENTITY,
the programId is preserved. `programId.dimensionId` keys in TRACKED_ENTITY context are stored
as-is because they are semantically tied to the program (enrollment scope), not to any stage.

### Fixed dimensions

Fixed dimensions are the structural dimensions that exist for every program/stage (org units,
dates, statuses). They are built by shared helpers in `src/modules/dimension.ts`
(`getStageFixedDimensions`, `getEnrollmentFixedDimensions`, `getTrackedEntityTypeFixedDimensions`)
and consumed by both the sidebar cards and the metadata provider.

| Scope      | Dimension ID     | Compound ID notation               | Display name source                                          | Sidebar card |
| ---------- | ---------------- | ---------------------------------- | ------------------------------------------------------------ | ------------ |
| Stage      | `ou`             | `stageId.ou`                       | `program.displayOrgUnitLabel` or "Event org. unit"           | Stage        |
| Stage      | `eventDate`      | `stageId.eventDate`                | `stage.displayExecutionDateLabel` or "Event date"            | Stage        |
| Stage      | `scheduledDate`  | `stageId.scheduledDate`            | `stage.displayDueDateLabel` or "Scheduled date"              | Stage        |
| Stage      | `eventStatus`    | `stageId.eventStatus`              | "Event status"                                               | Stage        |
| Enrollment | `ou`             | `programId.ou`                     | `program.displayOrgUnitLabel` or "Enrollment org. unit"      | Enrollment   |
| Enrollment | `enrollmentDate` | `programId.enrollmentDate`         | `program.displayEnrollmentDateLabel` or "Date of enrollment" | Enrollment   |
| Enrollment | `incidentDate`   | `programId.incidentDate`           | `program.displayIncidentDateLabel` or "Incident date"        | Enrollment   |
| Enrollment | `programStatus`  | `programId.programStatus`          | "Enrollment status"                                          | Enrollment   |
| TEI        | `enrollmentOu`   | `trackedEntityTypeId.enrollmentOu` | "Registration org. unit"                                     | Registration |
| TEI        | `created`        | `trackedEntityTypeId.created`      | "Registration date"                                          | Registration |

Non-fixed dimensions use compound or plain IDs depending on their type:

- **Data elements, categories, COGS** → compound: `stageId.dimensionId`
- **Program indicators, tracked entity attributes** → **plain** `dimensionId` (no prefix,
  even though their dimension records carry `program`/`programStage` context)
- **Metadata dims** (`lastUpdated`, `createdBy`, `lastUpdatedBy`, `created`, `completed`)
  → plain `dimensionId`

`getCompoundDimensionId` in `src/modules/dimension.ts` constructs the canonical app-local
compound ID from a `DimensionRecord`. It applies these rules in order:

1. `PROGRAM_INDICATOR` / `PROGRAM_ATTRIBUTE` → always plain `dimensionId`
2. Enrollment-scoped IDs (`enrollmentOu`, `enrollmentDate`, `incidentDate`, `programStatus`)
   → `programId.dimensionId`
3. Has `programStage` → `stageId.dimensionId` (or `programId.stageId.dimensionId` for TEI)
4. Has `program` → `programId.dimensionId`
5. TEI with `trackedEntityTypeId` → `trackedEntityTypeId.dimensionId`
6. Otherwise → plain `dimensionId`

**Org unit scopes**: the app uses distinct dimension IDs for different org unit scopes:

- **Event org unit**: `ou` with `programStage` → compound `stageId.ou`
- **Enrollment org unit**: `enrollmentOu` → compound `programId.enrollmentOu`.
  `toAppLocalDimensions` renames API `ou` (with program, no programStage) to `enrollmentOu`
  at the API → app-local boundary. `toApiDimensionId` does the inverse on save — but only
  in some outputType/visType combinations (see table below).
- **Registration org unit**: `enrollmentOu` with `trackedEntityType` (no program/stage) →
  compound `tetId.enrollmentOu`. The TEI registration OU shares the `enrollmentOu` dimension
  ID with the program-scope enrollment OU; the prefix (programId vs trackedEntityTypeId)
  distinguishes them.

**`enrollmentOu` POST translation by outputType/visType/scope**: the eventVisualizations
POST endpoint accepts `enrollmentOu` verbatim only when the dim carries a program qualifier
AND the visualization is in EVENT/TEI LINE_LIST mode. Other combinations — including the
TEI registration OU, which has no program qualifier — must be sent as bare `ou`.
`toEventVisualizationDimensionId` applies this mapping on save:

| outputType                | visType       | dim has `programId`? | POST dimension | Rewrite `enrollmentOu` → `ou`? |
| ------------------------- | ------------- | -------------------- | -------------- | ------------------------------ |
| `EVENT`                   | `LINE_LIST`   | yes                  | `enrollmentOu` | no                             |
| `ENROLLMENT`              | `LINE_LIST`   | yes                  | `ou`           | yes                            |
| `TRACKED_ENTITY_INSTANCE` | `LINE_LIST`   | yes (program-scope)  | `enrollmentOu` | no                             |
| `TRACKED_ENTITY_INSTANCE` | `LINE_LIST`   | no (registration)    | `ou`           | yes                            |
| `EVENT`                   | `PIVOT_TABLE` | yes                  | `ou`           | yes                            |
| `ENROLLMENT`              | `PIVOT_TABLE` | yes                  | `ou`           | yes                            |

Rule: rewrite to `ou` when the dim has no `programId` (i.e. TEI registration scope)
OR `outputType === 'ENROLLMENT'` OR `visType === 'PIVOT_TABLE'`. Keep as `enrollmentOu`
only for program-scope dims in `EVENT`/`TRACKED_ENTITY_INSTANCE` `LINE_LIST`.

The reverse (load) direction is shape-based — `toAppLocalDimensions` rewrites
`dim.dimension === 'ou' && !dim.programStage` to `enrollmentOu`. This catches both
program-scope (`{dimension: 'ou', program: {id}}`) and TEI registration
(`{dimension: 'ou'}`, no program/stage) and leaves stage event OU
(`{dimension: 'ou', programStage: {id}}`) untouched.

### Save/load translation at the visualization API boundary

**Loading** (API → frontend): `acSetVisualization` reads each dimension's `program` and
`programStage` from the populated `columns`/`rows`/`filters` objects and calls `getFullDimensionId`
(or `formatDimensionId` in the line-listing-app). For EVENT/ENROLLMENT this produces
`stageId.dimensionId` (dropping the programId). For TRACKED_ENTITY it produces
`programId.stageId.dimensionId` or `programId.dimensionId`.

**Saving** (frontend → API): `getAxesFromUi` (or equivalent) decomposes the internal compound ID
via `getDimensionIdParts` (`extractDimensionIdParts` in the line-listing-app) and sends each
dimension to the API with a plain `dimension` ID plus separate `program` and `programStage`
objects. The backend's `mergeAnalyticalObject` hydrates the stage from the database (including its
parent program via `loadProgramForStage`), then `getQualifiedDimension` rebuilds the persisted
string as `programId.stageId.dimensionId`.

### `programDimensions` field on eventVisualizations

`programDimensions` is a **computed, read-only** field — not persisted. On each GET, the backend
(`EventVisualizationController.postProcessResponseEntity`) iterates all `DimensionalObject`s in
`columns`, `rows`, and `filters`, extracts distinct program references, and fetches the full
`Program` objects. It provides clients with a convenience list of all programs referenced in the
layout. POSTing this field has no effect.

### Metadata store ordering

When adding metadata to the store in a **single batch** (via `addMetadata`), plain items (programs,
stages) are always processed before compound-key items, so context is available for field
enrichment. When adding items **one at a time**, add programs and stages before any dimensions that
reference them.

### `DimensionMetadataItem` key fields

| Field             | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `id`              | The **compound** ID (canonical form: `stageId.dimId`), or plain ID for non-compound dimensions |
| `dimensionId`     | The **plain** (last) segment — always set on `DimensionMetadataItem`                           |
| `programId`       | ID of the owning program (if applicable)                                                       |
| `programStageId`  | ID of the owning stage (if applicable)                                                         |
| `repetitionIndex` | Repetition index extracted from `[n]` suffix                                                   |
| `optionSetId`     | ID reference to the option set (if applicable)                                                 |
| `legendSetId`     | ID reference to the legend set (if applicable)                                                 |

## Testing & Linting Workflow for AI Agents

**Golden rule**: during development, lint/test only the files you touched. Before finishing, always run `pnpm test` and `pnpm lint`.

### Per-file commands (during development)

- **Vitest**: `pnpm exec vitest run <file-path>`
- **ESLint**: `pnpm exec eslint <file-path>` (add `--fix` to auto-fix)
- **Stylelint**: `pnpm exec stylelint <file-path> --max-warnings=0` (add `--fix` to auto-fix)
- **Prettier**: `pnpm exec prettier --write <file-path>`

ESLint, Stylelint, and Prettier run automatically via PostToolUse hooks after Edit/Write. Files modified via Bash are **not** auto-formatted — run Prettier manually after.

### TypeScript

File-specific `tsc` is not possible (path aliases, project references). Use the `typescript-lsp` plugin for diagnostics, or run `./scripts/check-typescript.sh` (covers both `tsconfig.json` and `cypress/tsconfig.json`).

### Before finishing

```bash
pnpm test     # all unit tests
pnpm lint     # ESLint, Stylelint, Prettier, TypeScript, ls-lint
```

If lint fails on formatting/auto-fixable issues, run `pnpm format` then re-run `pnpm lint`. Type errors and logic issues require manual fixes.
