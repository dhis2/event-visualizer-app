# Visualization metadata import

The E2E instances are built from the `analytics-with-ever-20261014` DB dump. The visualizations the E2E suite and the line list fixture capture (`pnpm cy:capture-fixtures`) need on top of that dump live in `visualizations/`, one metadata payload per file.

`db-dump-visualizations.json` lists the IDs and names of the event visualizations in the DB dump. Don't put any of them in `visualizations/`: the dump is shared with other apps' E2E suites, and `import.sh` would overwrite their copy.

Before every E2E run, Cypress checks that the instance has every visualization from both lists (`cypress/plugins/check-instance-visualizations.ts`). If one is missing, the run stops and names it.

## Recreating an instance

1. Reset the instance in the Instance Manager.
2. Run `./visualization-metadata-import/import.sh [url]`.

The URL defaults to `https://e2e.im.dhis2.org/idv-playground`. The credentials come from `cypress.env.json`. The script needs `jq`.

The import is atomic and idempotent: if one object fails, nothing is imported, and importing again updates the objects instead of creating duplicates.

## Adding a visualization

Export a similar visualization and adapt it:

```bash
curl -u <user>:<password> "<url>/api/metadata?eventVisualizations=true&skipSharing=true&skipCreatedAndLastUpdated=true&filter=id:eq:<id>"
```

Give it a fresh UID from `<url>/api/system/id`. Fields left out get their default value, and an imported visualization is owned by the importing user.

## The data in the DB dump

- A yearly SQL script moves all dates in the DB forward, so use relative periods (`THIS_YEAR`, `LAST_12_MONTHS`). Fixed periods would end up outside the data.
- In the large programs nearly every combination of options, org units and periods has data. A pivot table with empty rows needs a combination the metadata rules out, as in `event-pivot-table-empty-rows`: a funding agency only covers some implementing partners.
