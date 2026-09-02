# Event Visualizer App - Agent Guidelines

## Project Overview

This is a DHIS2 Event Visualizer application built with React, TypeScript, Vite, Redux Toolkit, and DHIS2 UI components. The application provides event data visualization capabilities within the DHIS2 ecosystem.

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

### Provider boundary: app vs plugin

The app (`src/app.ts`) and the dashboard plugin (`src/dashboard-plugin.tsx`) are
two entry points with deliberately different provider stacks.

- The **app** mounts a wide range of providers in the app-wrapper — the Redux
  store, `AppCachedDataQueryProvider`, the metadata store, and more.
- The **plugin** mounts only the **plugin-side metadata store provider**
  (`PluginMetadataProvider`). It must not mount the Redux store
  (`StoreProvider`) or `AppCachedDataQueryProvider` — those pull the app's
  cached-data query (`me`, `systemSettings`, org units, org unit levels) into
  every plugin instance on a dashboard.

**The rule:** `PluginWrapper` and everything below it in the component tree may
depend only on the metadata store provider plus the providers supplied by the
DHIS2 app-shell / app-adapter (the data engine and `useDataQuery`, config,
alerts, etc.). It must not touch the app's Redux store — no `useAppSelector`,
`useAppDispatch`, or RTK-query hooks (`useRtkQuery`) — and not
`AppCachedDataQueryProvider`.

Consequences that follow from this:

- Fetch inside the plugin path with app-runtime's `useDataQuery` / `useDataEngine`
  (provided by the app-adapter), never the RTK-query hooks (which live in the
  store).
- Editor-only actions that need the store (e.g. opening the dimension modal on a
  column-header click) are injected as callbacks by the app, not dispatched from
  inside a shared component. A shared component in the plugin path takes such a
  handler as an optional prop; the app canvas provides it, the plugin and the
  interpretation modal do not.

## Where helpers live in `src/modules`

A helper lives in the domain of what it **produces**, not the domains it reads from (a function
that reads a visualization but returns dimensions belongs with the dimension helpers). Code not
owned by any one domain — generic, cross-cutting utilities — goes in `modules/utils`; keep that
bar high so it stays a small set of genuine utilities, not a catch-all for anything awkward to
place. A domain that outgrows a single file becomes a folder of sibling files; import the specific
file you need (`@modules/<domain>/<file>`). Avoid `index.ts` barrels — Vite's performance guide
advises against them, since importing one API forces every re-exported module (and its side
effects) to load. This is a guideline, not an absolute — the occasional helper won't have a clean
"output" domain.

## Code Conventions

### Communicating with the user

- Write plainly. Short sentences, common words, no filler.
- Explain things the way you would to a colleague, not in dense prose.
- No hedging or clever phrasing that has to be re-read to parse.
- Prefer a few clear lines over a wall of text.

### Code Style

- **Self-documenting code over comments**: Prefer well-named intermediate variables and
  small helpers over explanatory comments. If a block needs a comment to explain what it
  does, first ask whether extracting a named variable or function would make the comment
  unnecessary.
- **When to comment**: Before writing any comment (file-level, function-level, or inline),
  name which category it falls in:
  (a) domain/business context that can't be inferred from the code, or
  (b) code that is genuinely hard to comprehend on its own.
  If you can't pin it to (a) or (b), don't write it. Default position is no comment.
  Never write a comment that restates what the next line does, and never write prose
  that simply summarises a file's or function's purpose — the name and types do that.
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
- **Resets**: Don't hand-write a `beforeEach` to undo mocks or stubs. `clearMocks`,
  `unstubEnvs` and `unstubGlobals` are on in `vitest.config.mts`, so call history and
  `vi.stubEnv`/`vi.stubGlobal` are already reset before every test. Resets that Vitest has
  no flag for — clearing `localStorage`, restoring real timers — belong in
  `vitest.setup.ts` if they apply everywhere, or in the spec if they don't. Clearing
  _within_ a single test is still explicit.

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

Testing Library's `waitFor()` uses real timers internally and conflicts with fake timers, so
timing-dependent hook tests need a specific setup. See the `testing-with-fake-timers` skill.

## DHIS2-Specific Considerations

- **App runtime hooks**: Use DHIS2 app runtime hooks (`useDataQuery`, `useDataMutation`, `useConfig`, etc.) through RTK wrappers
- **Design system**: Follow DHIS2 design system and patterns
- **Internationalization**: Use DHIS2 i18n utilities for all user-facing strings
- **Testing environments**: Test against DHIS2 instances (development and production)
- **Authentication**: Handle DHIS2 authentication and authorization properly
- **Browser testing**: On the host, drive the running app with **claude-in-chrome** (works in both terminal and desktop Claude Code; the developer sets it up via the Claude browser extension — see README). If you need browser automation on the host and it isn't connected, ask the human to set it up. In the AI sandboxes, use the `playwright-cli` tool instead (see [docs/claude-sandboxes.md](docs/claude-sandboxes.md)). Read `cypress.env.json` (gitignored) for the DHIS2 server URL and login credentials. The dev server on `localhost:3000` shows a login form requiring Server, Username, and Password
- **Deployment**: App can be deployed as both a standalone app and a plugin

## Understanding the DHIS2 Web API

Never rely on training data for DHIS2 API specifics — endpoint paths, parameters, response
shapes, and filter syntax all change between versions. Look them up against the target
instance: see the `dhis2-api-lookup` skill for the three-tier procedure (OpenAPI spec →
probe the live API → read the `dhis2-core` source).

**GET requests only** against the dev instance from `cypress.env.json` — never POST, PUT,
PATCH, or DELETE, and never a production server.

## Plugins and MCP Servers

The following are enabled for this project via `.claude/settings.json`:

### Plugins (marketplace)

- **TypeScript LSP** (`typescript-lsp`): Automatic TypeScript diagnostics after file edits with full project context. See [Claude Code Setup in README](#) for per-developer installation.
- **Context7** (`context7`): Library and framework documentation search. **Usage**: Use proactively when answering questions about specific library/framework APIs; otherwise trigger with `use context7`.

### MCP Servers (manual)

- **Grep by Vercel** (`grep_*`): Fast code search across GitHub repositories. **Usage**: Trigger-based only — add `use the grep tool` to your prompts when you want cross-repo search.

**Browser automation**: On the host, use **claude-in-chrome** (terminal or desktop Claude Code; requires the developer to install and connect the Claude browser extension — see README). If you need to drive the browser on the host and it isn't set up, you may ask the human to set it up for you. In the AI sandboxes, browser automation is provided by the baked-in `playwright-cli` (see [docs/claude-sandboxes.md](docs/claude-sandboxes.md)).

**GitHub**: Use the `gh` CLI via Bash for all GitHub operations (issues, PRs, code search, actions). Requires the [GitHub CLI](https://cli.github.com/) to be installed and authenticated (`gh auth login`). In the AI sandboxes `gh` is authenticated read-only (writes fail by design).

**Linting**: ESLint, Stylelint, and Prettier are run automatically via PostToolUse hooks. For manual checks, use `pnpm exec eslint <file-path>`.

## Git Workflow

**IMPORTANT FOR AI AGENTS**: **DO NOT stage files or create commits**. The user reviews diffs, stages changes, and commits. Your role is to modify code files only - all git operations (staging, committing, pushing) are the user's responsibility.

### Git Hooks

The project has `lint-staged` configured in `package.json` for pre-commit checks (ESLint, Prettier, Stylelint). Git hooks live in the tracked `.hooks/` directory; `scripts/postinstall.sh` wires them up by pointing `core.hooksPath` at it.

### Commit Guidelines

- **Format**: Follow conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- **Branches**: Use feature branches for development
- **PRs**: Pull requests should include tests for new functionality
- **Atomicity**: Keep commits focused and atomic
- **Testing**: Run tests before committing (`pnpm test`, `pnpm lint`)

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
dates, statuses). They are built by shared helpers in `src/modules/dimension/fixed.ts`
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

`getCompoundDimensionId` in `src/modules/dimension/ids.ts` constructs the canonical app-local
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

**Loading** (API → frontend), in order:

1. `normalizeApiSavedVisualization` (`@modules/visualization/state`) brings the API
   payload to app shape: upgrades legacy dimensions, maps `PROGRAM_DATA_ELEMENT` → `DATA_ELEMENT`,
   and strips the wire-only dimensions (`WIRE_ONLY_DIMENSIONS` in `@modules/dimension/ids`).
2. `toAppLocalDimensions` (`@modules/dimension/translation`) renames API `ou` with a program but
   no programStage to `enrollmentOu`.
3. `getCompoundDimensionId` (`@modules/dimension/ids`) builds the canonical app-local compound ID
   from each `DimensionRecord`, reading its `program` and `programStage`. For EVENT/ENROLLMENT this
   produces `stageId.dimensionId` (dropping the programId); for TRACKED_ENTITY,
   `programId.stageId.dimensionId` or `programId.dimensionId`.
4. `getVisualizationUiConfig` (`@modules/visualization/state`) derives `visUiConfig` — layout
   arrays, items, conditions and options — from the loaded visualization.

**Saving** (frontend → API), in order:

1. `buildAxis` (`@modules/layout`) rebuilds each axis from the layout's compound IDs, calling
   `toEventVisualizationDimensionId` (`@modules/dimension/translation`) for the POST dimension ID
   and emitting separate `program` and `programStage` objects. See the `enrollmentOu` mapping table
   above for the outputType/visType rules it applies.
2. `getSaveableVisualization` (`@modules/visualization/state`) drops the non-persisted dimension
   props via `removeDimensionPropertiesBeforeSaving` (`@modules/dimension/translation`) and
   formats sorting for the API.
3. The backend's `mergeAnalyticalObject` hydrates the stage from the database (including its parent
   program via `loadProgramForStage`), then `getQualifiedDimension` rebuilds the persisted string as
   `programId.stageId.dimensionId`.

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
| `legendSetIds`    | IDs of every legend set assigned to the data item, i.e. the grouping options available         |

## Grouping values by legend

A numeric data item that has legend sets assigned can be grouped by legend. The chosen legend set
is stored as `legendSet` on the dimension's `conditionsByDimension` entry, and reaches the analytics
API as a `-<legendSetId>` suffix on the dimension (`stageId.dimId-legendSetId`), which
`@dhis2/analytics` builds from `DimensionRecord.legendSet`. Response values then come back as legend
IDs, named via `metaData.items`.

- **Availability**: the sidebar's `analytics/*/query/dimensions` endpoint does not return
  `legendSets`, so they are fetched per data item from `dataElements`/`trackedEntityAttributes`/
  `programIndicators` (`@api/legend-sets-api`) and cached in the metadata store as `legendSetIds`.
- **Defaults**: pivot tables default to the first legend set, line lists to no grouping (the absence
  of state). Seeded by the listener in `@store/seed-default-grouping` when a dimension is added to
  the layout or its modal is opened, keyed off presence so an explicit choice is never overwritten.
- **Filtering**: grouping and filtering share the conditions entry, so
  `setVisUiConfigGroupingByDimension` drops the filter whenever the grouping changes. A grouped
  dimension filters by legend (`IN:legendId;legendId`) through a transfer instead of by raw value.

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
