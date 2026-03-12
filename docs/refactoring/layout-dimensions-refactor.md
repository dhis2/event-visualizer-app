# Layout Dimensions Refactor

## Goal

Replace ambiguous nested string IDs (`"programId.stageId.dimensionId"`) with explicit object structures that store dimension context (program, stage, tracked entity type) as separate fields and co-locate related data (items, conditions, repetitions).

**Key Benefits:**

-   Zero ambiguity - always know what each ID represents
-   No dependency on `outputType` for parsing IDs
-   Explicit context fields instead of string parsing
-   Items/conditions/repetitions co-located with dimensions

## Approach

**Clean break refactor** - Remove old structure completely, use ErrorBoundary for components during transition.

**Working incrementally** - Complete one phase fully before moving to next.

## Collaboration Approach

**Roles:**

-   **User (Hendrik):** Implements the bulk of application code changes
-   **AI Assistant:** Reviews changes, adds/adjusts tests, provides advice on application code when requested

**Guidelines:**

-   AI may freely edit test code and markdown files
-   AI suggests changes to application code and waits for permission before applying
-   User commits when a phase/sub-phase is complete
-   AI updates the refactor plan after each commit

---

## Current Phase: Phase 2 - Metadata Store

**Status:** 🟡 Not Started

### Motivation

The Redux store now uses `DimensionIdentifier` (with explicit `id`, `programId`, `programStageId`, etc. fields) as the canonical way to refer to dimensions. However, the metadata store still uses dotted compound string keys (`"programId.stageId.dimensionId"`) to store and retrieve items. This creates a mismatch: the app frequently looks up a full metadata object based on an ID it got from Redux, and currently must reassemble a dotted string key to do so.

The metadata store should speak the same language as the Redux store: lookup should work with a `DimensionIdentifier` object, and the internal key should be an unambiguous derived string (no context-dependent parsing needed).

### Scope

1. **Singular, unambiguous key notation**

    - Design and implement a `toDimensionKey(identifier: DimensionIdentifier): string` helper that produces a stable, unambiguous string key from a `DimensionIdentifier`. Similar to the dotted notation from the web API, but without the ambiguity (no need to peek at other store entries to interpret the meaning of segments).
    - Example key shapes:
        - `"ou"` — plain dimension with no program context
        - `"stgXyz::deAbc"` — stage-scoped dimension (stage + dimension)
        - `"prgAbc::stgXyz::deAbc"` — fully qualified dimension (program + stage + dimension)
    - The separator `::` (or similar) should be chosen to avoid collisions with valid DHIS2 UIDs (which are alphanumeric).

2. **Type alignment with `DimensionIdentifier`**

    - Review `DimensionMetadataItem` and the `DimensionMetadata` struct in `src/types/metadata.ts` and align field names/semantics with `DimensionIdentifier` (which uses `id`, `programId`, `programStageId`).
    - The `DimensionMetadata` return type of `getDimensionMetadata()` should use the same field names as `DimensionIdentifier` (currently it uses `dimensionId` instead of `id`).

3. **Lookup by `DimensionIdentifier`**

    - Add a `getMetadataItemByIdentifier(identifier: DimensionIdentifier): MetadataItem | undefined` method (and corresponding hook `useMetadataItemByIdentifier`) to `MetadataStore`.
    - This replaces the need to call `getFullDimensionId()` followed by `getMetadataItem()` at the call site.

4. **Correct ingestion from all data sources**

    - **Visualization load** (`setVisualizationMetadata`): ensure keys are derived via `toDimensionKey` consistently.
    - **Analytics response** (`addAnalyticsResponseMetadata`): map analytics `metaData.items` keys to `DimensionIdentifier`-based keys.
    - **Ad-hoc** (`addMetadata`): ensure callers provide enough context (programId, programStageId) when storing scoped dimensions.

5. **Remove old key-parsing logic**
    - Remove `parseDimensionIdInput()` and the ambiguous multi-step parsing in `getDimensionMetadata()`.
    - Remove `getFullDimensionId()` or repurpose as `toDimensionKey`.

### Current Parsing Logic (to be replaced)

This section documents the existing ambiguous logic so a new session understands what it is replacing.

**`parseDimensionIdInput(input: string)`** — `src/components/app-wrapper/metadata-provider/dimension.ts`

Splits a dotted dimension ID string like `"programId.stageId.dimensionId"` into segments:

-   Strips optional repetition index suffix (`[0]`, `[-1]`) from the input first
-   Splits on `"."` to get 1–3 `ids`
-   Returns `{ ids, repetitionIndex? }`

It only splits; it cannot tell you whether a 2-segment key is `program.dimension` or `stage.dimension` — that requires a runtime store peek (see below).

**`getFullDimensionId({ dimensionId, programId, programStageId, outputType })`** — `src/modules/dimension.ts`

Reconstructs a dotted string from parts:

-   For `outputType === 'TRACKED_ENTITY_INSTANCE'`: joins `[programId, programStageId, dimensionId]`
-   For all other output types: joins `[programStageId, dimensionId]` (programId is omitted)
-   Filters out `undefined` segments before joining

This means the same `{ programId, programStageId, dimensionId }` triple produces **different keys depending on `outputType`** — the core ambiguity.

**`getDimensionMetadata(input: string)`** — `src/components/app-wrapper/metadata-provider/metadata-store.tsx`

The most complex piece. Takes a raw dotted string and:

1. Calls `parseDimensionIdInput` to get `ids[]`
2. Interprets `ids` based on length:
    - **1 segment** → plain `dimensionId`
    - **2 segments** → **runtime store peek**: calls `this.metadata.get(ids[0])` and checks whether it is a `Program` or `ProgramStage` to decide if the first segment is `programId` or `programStageId`
    - **3 segments** → `[programId, programStageId, dimensionId]`
3. Attempts two lookups for the dimension itself: `metadata.get(ids.join('.'))` first, then falls back to `metadata.get(dimensionId)`
4. Returns a `DimensionMetadata` struct with `dimensionId` (not `id`), `programId?`, `programStageId?`, `repetitionIndex?`, plus the resolved `dimension`, `program`, and `programStage` objects

The runtime peek in step 2 means lookup correctness depends on whether the program/stage metadata has already been loaded — a subtle ordering dependency.

### Tasks

-   [ ] Design and implement `toDimensionKey(identifier: DimensionIdentifier): string`
-   [ ] Add comprehensive tests for `toDimensionKey`
-   [ ] Update `MetadataStore` to use `toDimensionKey` internally
-   [ ] Add `getMetadataItemByIdentifier` / `useMetadataItemByIdentifier`
-   [ ] Align `DimensionMetadata` type with `DimensionIdentifier` field names
-   [ ] Update `setVisualizationMetadata` to derive keys via `toDimensionKey`
-   [ ] Update analytics response metadata ingestion
-   [ ] Update ad-hoc `addMetadata` call sites
-   [ ] Remove `parseDimensionIdInput` and related ambiguous logic
-   [ ] Update all consumers of `getDimensionMetadata` / `getFullDimensionId`
-   [ ] Run full test suite and fix any failures

---

## Completed Phases

### Phase 1: Types, State Slice, and Tests ✅

**Completed:** 2026-03-11

**What was done:**

1. **Type Definitions** (`src/types/layout.ts`)

    - `DimensionIdentifier` — unambiguous dimension reference with explicit context fields (`id`, `programId`, `programStageId`, `trackedEntityTypeId`, `repetitionIndex`)
    - `LayoutDimension` — extends `DimensionIdentifier` with `items`, `conditions`, `repetitions`
    - `Layout` — `Record<Axis, LayoutDimension[]>`
    - `ConditionsObject`, `RepetitionsObject`, `LayoutDimensionUpdate` helper types

2. **Helper Utilities** (`src/modules/layout.ts`)

    - `dimensionMatches(dimension, identifier)` — strict equality match on all context fields
    - `findDimension(dimensions, identifier)` — finds in flat array
    - Layout mutation helpers used internally by the slice

3. **Redux Slice** (`src/store/vis-ui-config-slice.ts`)

    - State shape: `layout: Layout` (grouped by axis), plus `visualizationType`, `outputType`, `options`
    - Actions: `addVisUiConfigLayoutDimension`, `updateVisUiConfigLayoutDimension`, `moveVisUiConfigLayoutDimension`, `removeVisUiConfigLayoutDimension`
    - Selectors: `getVisUiConfigLayout`, `getVisUiConfigAllLayoutDimensions`, `getVisUiConfigLayoutDimensionsForAxis`, `getVisUiConfigLayoutDimension`, `getVisUiConfigLayoutDimensionItems`, `getVisUiConfigLayoutDimensionConditions`, `getVisUiConfigLayoutDimensionRepetitions`

4. **Tests** (`src/store/__tests__/vis-ui-config-slice.spec.ts`)

    - 39 tests covering all actions and selectors, all passing
    - Test helper `createStateWithDimensions(layout: LayoutInput)` mirrors the actual state structure (columns/rows/filters grouping)

**Key decisions:**

-   `dimensionMatches()` uses strict equality — `undefined !== "someId"` — so partial identifiers never accidentally match scoped dimensions
-   Layout grouped by axis (not a flat array) to make axis-specific operations O(n) on a small subset
-   `id` field name (not `dimensionId`) to align with broader DHIS2 conventions

---

## Known Issues

_None_

---

**Last Updated:** 2026-03-11 - Phase 1 complete; Phase 2 (metadata store) defined
