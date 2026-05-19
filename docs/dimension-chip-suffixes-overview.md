# Dimension chip suffixes

## What this is for

When a visualization mixes data from more than one program or stage, two
chips can easily end up with the same name (e.g. two `Event status` chips).
To make them tellable apart we append a short suffix to the chip label —
but only when it actually helps.

## Where it applies

- Layout chips (columns, rows, filters)
- Visualization labels: table column headers, pivot headers, chart series
  and axes

It does **not** affect the sidebar, popovers, or modals.

Only relevant for enrollment and tracked-entity visualizations. Event-only
visualizations have a single program and stage, so there's nothing to
disambiguate.

## Dimension types

- **Stage** — belongs to a specific program stage (data element, event
  date, event status, event org. unit, …)
- **Enrollment** — belongs to a program but not to a stage (enrollment
  date, enrollment status, enrollment org. unit, program indicators,
  program attributes)
- **Tracked entity** — belongs to the tracked entity itself (registration
  org. unit, registration date, tracked-entity attributes)
- **General** — anything else (e.g. last-updated metadata)

## The rule

Look at the whole layout (columns + rows + filters together) and count how
many distinct programs and how many distinct stages appear.

- A **stage** chip gets the **stage name** when the layout has more than
  one stage, **or** the **program name** when there's only one stage but
  more than one program.
- An **enrollment** chip gets the **program name** when the layout has
  more than one program.
- **Tracked entity** and **general** chips never get a suffix.

**Compound modifier.** If two stage chips would end up with the same
stage-name suffix (because two programs have stages with identical names),
those chips switch to a compound suffix: `Program X, Stage Y`. Only the
colliding chips are affected — uniquely-named stages keep the bare stage
name.

## Format

Chip name, comma, suffix.

- Plain: `Data element A, Stage 1`
- Compound: `Data element A, Program 1, Visit`

## Illustrative example

A layout combining two programs P1 and P2 where both have a stage called
"Visit", plus a third stage called "Final":

- `Data element A, Program 1, Visit` — P1's Visit (compound, name clash)
- `Data element B, Program 2, Visit` — P2's Visit (compound, name clash)
- `Data element C, Final` — P1's uniquely-named stage
- `Enrollment status, Program 2` — enrollment chip, multiple programs
- `Registration org. unit` — tracked-entity chip, never suffixed

## Limitations

- Two programs sharing the same name still produce ambiguous labels.
- Long names can make chips wide; truncation behavior is not defined here.
- The sidebar still shows just the dimension name; the same name may
  appear several times in different cards.

## Behavior changes from today

- Some chips will gain a suffix they didn't have (when multiple stages are
  in the layout, even without a name clash).
- Some chips will lose a suffix they had (when only a single program and
  stage are involved).

Both are intended.
