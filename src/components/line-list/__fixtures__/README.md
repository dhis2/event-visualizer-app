# Line-list fixtures

One directory per test scenario, one file per API response, so the layout
mirrors the requests the app makes:

- `event-visualization.json` — the `eventVisualizations/<id>` response
- `analytics.json` — the analytics query response
- `legend-sets.json` — the `legendSets` response (only when the scenario
  fetches legend sets)

All scenarios exist as saved visualizations on
[the instance CI's e2e suite runs against](https://e2e.im.dhis2.org/analytics-dev);
the capture spec maps each directory to its visualization ID:

- `e2e-enrollment` (`AFjkDs7acBh`) — "E2E: Enrollment": a minimal enrollment
  line list
- `inpatient-visit-overview-bombali` (`kb9Uml5FEEz`) — "Inpatient: Visit
  overview this year Bombali": a wide event line list with option sets and
  legend-grouped columns
- `inpatient-extra-columns-and-legends` (`Rq4ppYwc4r8`) — "Inpatient: Cases
  under 5 years female this year (case) additional columns and legends": data
  element and program indicator columns plus a by-data-item legend, for legend
  resolution and coloring
- `no-time-dimension` (`ETJXkMmCGsK`) — "No time dimension": a line list
  without any time dimension, for the NoTimeDimensionWarning

## Regenerating

All captured files are written verbatim by loading each visualization in the
running app and saving the intercepted responses:

```sh
pnpm cy:capture-fixtures
pnpm format
```

When adding a scenario, save the visualization on the instance above first,
then add it to `cypress/fixture-capture/recapture-line-list-fixtures.cy.ts`
and to the list above.
