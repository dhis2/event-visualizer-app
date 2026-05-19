# Dimension chip suffixes

## 1. Purpose and scope

When a layout combines dimensions from multiple programs or program stages,
chip labels can be ambiguous (two `Event status` chips, two `Data element A`
chips). This spec defines a deterministic suffix that is appended to the
dimension's `name` so users can tell which program and stage a chip belongs
to.

**The rules apply to**

- Layout chip labels (columns, rows, filters axes)
- Rendered visualization labels:
    - Line list table column headers
    - Pivot table dimension headers
    - Chart series and category-axis labels

**The rules do NOT apply to**

- The sidebar dimension list (always shows the dimension's own `name`)
- Dimension popovers, filter modals, or other secondary surfaces

**Output types.** Rules apply to `ENROLLMENT` and `TRACKED_ENTITY_INSTANCE`
visualizations only. `EVENT` visualizations have one program and one stage by
definition — no rule ever triggers.

## 2. Dimension bindings

Every dimension belongs to exactly one bucket, determined by the `programId` /
`programStageId` / `trackedEntityTypeId` already stored on the
`DimensionMetadataItem` after normalization:

| Binding              | Definition                                          | Examples                                                                                                      |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Stage-bound**      | `programStageId` is set                             | Data element, event date, scheduled date, event org. unit, event status                                       |
| **Enrollment-bound** | `programId` is set, `programStageId` is not         | Enrollment date, incident date, enrollment org. unit, enrollment status, program indicator, program attribute |
| **TET-bound**        | `trackedEntityTypeId` is set; program/stage are not | Registration org. unit, registration date, tracked entity attribute                                           |
| **Unbound**          | None of the above                                   | `Last updated on`, organisation unit group sets, generic metadata dimensions                                  |

> **Implementation note.** Do not infer binding from raw id parsing.
> `getDimensionIdParts` cannot distinguish `programId.dim` from `stageId.dim`
> outside TEI mode. The metadata-provider's normalization
> (`extractDimensionContextFromCompoundId`) already disambiguates and stores
> the binding fields on each item — read those.

## 3. Layout scope

"The layout" is the union of all dimensions across **columns + rows + filters**
of the current visualization (deduplicated by id).

Two counts drive the rules:

- `nStages` — distinct `programStageId` values among layout dimensions whose
  binding is **stage-bound**. Repetition indices `[n]` on the same stage id
  collapse: `psid[0]` and `psid[1]` count as one stage.
- `nPrograms` — distinct `programId` values among layout dimensions whose
  binding is stage-bound or enrollment-bound. TET ids never count.

## 4. Suffix decision

For each chip, the suffix is decided from its binding plus
`(nStages, nPrograms)`:

| Binding              | `nStages ≤ 1` & `nPrograms ≤ 1` | `nStages > 1` & `nPrograms ≤ 1` | `nStages ≤ 1` & `nPrograms > 1` | `nStages > 1` & `nPrograms > 1` |
| -------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| **Stage-bound**      | no suffix                       | **stage name** ¹                | **program name** (fallback)     | **stage name** ¹                |
| **Enrollment-bound** | no suffix                       | no suffix                       | **program name**                | **program name**                |
| **TET-bound**        | no suffix                       | no suffix                       | no suffix                       | no suffix                       |
| **Unbound**          | no suffix                       | no suffix                       | no suffix                       | no suffix                       |

¹ **Compound modifier — stage name collision.** When a stage-bound chip
would receive a `stage name` suffix, and that stage's name appears for more
than one distinct stage id within the layout, the chip's suffix is upgraded
to `program name, stage name`. The modifier is applied **per stage id** —
only chips for a colliding stage receive the compound; uniquely-named stages
in the same layout keep the bare stage name.

**Rendering.** The chip is rendered as `name` + `, ` + suffix:

    DimensionName, Suffix

For the compound case, the suffix itself contains a comma:

    DimensionName, Program X, Stage Y

## 5. Examples

### 5.1 Single program, single stage

`(nStages=1, nPrograms=1)` — no rule triggers.

| Dimension       | Binding | Label             |
| --------------- | ------- | ----------------- |
| Data Element A  | P1 / S1 | `Data element A`  |
| Event status    | P1 / S1 | `Event status`    |
| Event org. unit | P1 / S1 | `Event org. unit` |

### 5.2 Single program, single stage, with enrollment-bound dimensions

`(nStages=1, nPrograms=1)` — no rule triggers.

| Dimension            | Binding | Label                  |
| -------------------- | ------- | ---------------------- |
| Data Element A       | P1 / S1 | `Data element A`       |
| Enrollment status    | P1      | `Enrollment status`    |
| Enrollment org. unit | P1      | `Enrollment org. unit` |

### 5.3 Single program, multiple stages — stage-bound only

`(nStages=2, nPrograms=1)` — stage-bound get stage name.

| Dimension      | Binding | Label                     |
| -------------- | ------- | ------------------------- |
| Data Element A | P1 / S1 | `Data element A, Stage 1` |
| Event status   | P1 / S2 | `Event status, Stage 2`   |

### 5.4 Single program, multiple stages, mixed bindings

`(nStages=2, nPrograms=1)` — stage-bound suffixed; enrollment-bound bare.

| Dimension            | Binding | Label                     |
| -------------------- | ------- | ------------------------- |
| Data Element A       | P1 / S1 | `Data element A, Stage 1` |
| Data Element B       | P1 / S2 | `Data element B, Stage 2` |
| Enrollment status    | P1      | `Enrollment status`       |
| Enrollment org. unit | P1      | `Enrollment org. unit`    |

### 5.5 Multiple programs, enrollment-bound only

`(nStages=0, nPrograms=2)`.

| Dimension            | Binding | Label                             |
| -------------------- | ------- | --------------------------------- |
| Enrollment org. unit | P1      | `Enrollment org. unit, Program 1` |
| Enrollment status    | P2      | `Enrollment status, Program 2`    |

### 5.6 Multiple programs, single stage in layout — fallback

`(nStages=1, nPrograms=2)`. Stage-bound chip uses program suffix.

| Dimension            | Binding | Label                             |
| -------------------- | ------- | --------------------------------- |
| Data Element A       | P1 / S1 | `Data element A, Program 1`       |
| Enrollment org. unit | P2      | `Enrollment org. unit, Program 2` |

### 5.7 Multiple programs, multiple stages, distinct stage names

`(nStages=2, nPrograms=2)`.

| Dimension      | Binding | Label                     |
| -------------- | ------- | ------------------------- |
| Data Element A | P1 / S1 | `Data element A, Stage 1` |
| Event status   | P2 / S5 | `Event status, Stage 5`   |

### 5.8 Multiple programs, multiple stages, identical stage names — compound

`(nStages=2, nPrograms=2)` and stage names collide.

| Dimension      | Binding (stage name) | Label                              |
| -------------- | -------------------- | ---------------------------------- |
| Data Element A | P1 / S1 ("Visit")    | `Data element A, Program 1, Visit` |
| Data Element B | P2 / S1 ("Visit")    | `Data element B, Program 2, Visit` |

### 5.9 Partial collision — compound only on the colliding stages

`(nStages=3, nPrograms=2)`. Two stages share the name "Visit"; one is unique.

| Dimension      | Binding (stage name) | Label                              |
| -------------- | -------------------- | ---------------------------------- |
| Data Element A | P1 / S1 ("Visit")    | `Data element A, Program 1, Visit` |
| Data Element B | P2 / S1 ("Visit")    | `Data element B, Program 2, Visit` |
| Data Element C | P1 / S2 ("Final")    | `Data element C, Final`            |

### 5.10 Multi-program, mixed bindings, distinct stage names

`(nStages=2, nPrograms=2)`. Stage-bound use stage; enrollment-bound use
program.

| Dimension         | Binding | Label                          |
| ----------------- | ------- | ------------------------------ |
| Data Element A    | P1 / S1 | `Data element A, Stage 1`      |
| Enrollment status | P2      | `Enrollment status, Program 2` |

### 5.11 TET-bound dimension in multi-program TEI layout

Registration org. unit is TET-bound and never receives a suffix.

| Dimension              | Binding | Label                          |
| ---------------------- | ------- | ------------------------------ |
| Registration org. unit | TET     | `Registration org. unit`       |
| Enrollment status      | P1      | `Enrollment status, Program 1` |
| Event date             | P2 / S1 | `Event date, Stage 1`          |

## 6. Edge cases

- **Repetition index `[n]`.** Two chips for the same stage id with different
  repetition indices contribute the same `programStageId` to `nStages`, and
  produce identical suffixes. The repetition index appears elsewhere on the
  chip (out of scope of this spec).
- **Missing metadata at render time.** If a program or stage referenced by a
  chip is not yet in the metadata store, the chip renders with no suffix.
  The suffix is reapplied as soon as metadata streams in.
- **Stage with no resolvable program.** Should not occur in well-formed
  metadata, but if a stage's `program.id` cannot be resolved, the chip uses
  the bare stage name even when compound would otherwise apply.
- **Compound with more than two colliding programs.** The compound is applied
  to every chip whose stage name collides; if three programs all have a
  "Visit" stage, all three "Visit" chips receive `Program N, Visit`.

## 7. Known limitations

- **Identical program names.** Two distinct programs in the same layout with
  identical `name` produce ambiguous labels under both the program-suffix
  rule and the compound modifier. This spec does not solve that case; it is
  rare in practice. A future spec can add a program-name collision rule.
- **Long labels.** With long dimension or stage names, chips can become very
  wide. This spec does not define overflow / tooltip behavior.
- **Internationalization.** The `, ` separator is not localized; both
  segments flow with the document direction.
- **Sidebar parity.** The sidebar deliberately does not apply these rules. In
  multi-program layouts the same `name` may appear several times in the
  sidebar; the user disambiguates by the card the dimension is under.

## 8. Behavior changes from the current implementation

The current code uses a different rule (per-axis duplicate detection of
`dimensionId`). Adopting this spec changes behavior in two directions:

- **Suffix added where there was none today.** Layouts with multiple stages
  and no `dimensionId` duplicates (e.g. `Stage1.DE-A`, `Stage2.DE-B`) will
  now show stage suffixes on every stage-bound chip.
- **Suffix removed where there is one today.** Single-program, single-stage
  layouts that today suffix duplicate `dimensionId`s no longer do — the rule
  cares about layout scope, not chip-name uniqueness.

Both are intentional consequences of moving from "minimal disambiguation per
chip" to "consistent disambiguation by scope".
