# Line-list fixtures

One directory per test scenario, one file per API response, so the layout
mirrors the requests the app makes:

- `event-visualization.json` — the `eventVisualizations/<id>` response
- `analytics.json` — the analytics query response
- `legend-sets.json` — the `legendSets` response (only when the scenario
  fetches legend sets)

Each directory is named after its visualization ID on the
[ever-playground instance](https://dev.im.dhis2.org/ever-playground), where
all of them exist as saved visualizations:

- `AFjkDs7acBh` — "E2E: Enrollment NEWNAME": a minimal enrollment line list
- `kb9Uml5FEEz` — "Inpatient: Visit overview this year Bombali": a wide event
  line list with option sets and legend-grouped columns
- `A8CgvIY3VEy` — "Inpatient: Cases under 5 years female this year (case)
  additional columns and legends": data element and program indicator columns
  plus a by-data-item legend, for legend resolution and coloring
- `ylhECvoYdzK` — "No time dimension": a line list without any time dimension,
  for the NoTimeDimensionWarning

## Regenerating

All captured files are written verbatim by loading each visualization in the
running app and saving the intercepted responses:

```sh
pnpm cy:capture-fixtures
pnpm format
```

When adding a scenario, save the visualization on ever-playground first, then
add its ID to `cypress/fixture-capture/recapture-line-list-fixtures.cy.ts` and
to the list above.
