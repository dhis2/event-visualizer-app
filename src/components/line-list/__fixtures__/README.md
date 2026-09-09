# Line-list fixtures

One directory per test scenario, one file per API response, so the layout
mirrors the requests the app makes:

- `event-visualization.json` — the `eventVisualizations/<id>` response
- `analytics.json` — the analytics query response
- `legend-sets.json` — the `legendSets` response (only when the scenario
  fetches legend sets)

All scenarios exist as saved visualizations on the
[ever-playground instance](https://dev.im.dhis2.org/ever-playground); the
capture spec maps each directory to its visualization ID:

- `e2e-enrollment` (`AFjkDs7acBh`) — "E2E: Enrollment NEWNAME": a minimal
  enrollment line list
- `inpatient-visit-overview-bombali` (`kb9Uml5FEEz`) — "Inpatient: Visit
  overview this year Bombali": a wide event line list with option sets and
  legend-grouped columns
- `inpatient-extra-columns-and-legends` (`A8CgvIY3VEy`) — "Inpatient: Cases
  under 5 years female this year (case) additional columns and legends": data
  element and program indicator columns plus a by-data-item legend, for legend
  resolution and coloring
- `no-time-dimension` (`ylhECvoYdzK`) — "No time dimension": a line list
  without any time dimension, for the NoTimeDimensionWarning

## Regenerating

All captured files are written verbatim by loading each visualization in the
running app and saving the intercepted responses:

```sh
pnpm cy:capture-fixtures
pnpm format
```

When adding a scenario, save the visualization on ever-playground first, then
add it to `cypress/fixture-capture/recapture-line-list-fixtures.cy.ts` and to
the list above.
