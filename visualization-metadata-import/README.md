# Visualization metadata import

The E2E instances are built from the `analytics-with-ever-20261014` DB dump. The visualizations the E2E suite and the line list fixture capture (`pnpm cy:capture-fixtures`) need on top of that dump live in `visualizations/`, one metadata payload per file. Once the set has settled, they become part of a new DB dump and this folder goes away.

`db-dump-visualizations.json` lists the IDs and names of the event visualizations in the DB dump. These must not be added to `visualizations/`.

## Recreating an instance

1. Reset the instance in the Instance Manager.
2. Run `./visualization-metadata-import/import.sh [url]`.
3. Run `./visualization-metadata-import/check.sh [url]` to confirm that the instance holds the DB dump, and no visualizations other than those in `visualizations/`.

The URL defaults to `https://e2e.im.dhis2.org/idv-playground`. The credentials come from `cypress.env.json`. Both scripts need `jq`.

The import is atomic and idempotent: if one object fails, nothing is imported, and importing again updates the objects instead of creating duplicates.

## Adding a visualization

Export a similar visualization and adapt it:

```bash
curl -u <user>:<password> "<url>/api/metadata?eventVisualizations=true&skipSharing=true&skipCreatedAndLastUpdated=true&filter=id:eq:<id>"
```

Give it a fresh UID from `<url>/api/system/id`. Fields left out get their default value, and an imported visualization is owned by the importing user.

## The data in the DB dump

- Data runs from 2025 into 2027 (Child Programme and WHO RMNCH have 2027 events). A yearly SQL script moves all dates in the DB forward, so use relative periods (`THIS_YEAR`, `LAST_12_MONTHS`): fixed periods would end up outside the data.
- Some programs are too small to be useful: Antenatal care visit (3 events), Information Campaign (6), Provider Follow-up (6), MNCH / PNC (11), XX MAL RDT (0). TB program has 50k enrollments but only 46 events, so it suits enrollment and tracked entity output only.
- Data is dense: in the large programs nearly every combination of options, org units and periods has data. A pivot table with empty rows needs a combination the metadata rules out, such as a funding agency with an implementing partner it doesn't cover (`event-pivot-table-empty-rows`).
- Gaps that need **metadata only** (easy to add): a legend set on a tracked entity attribute or a program indicator.
- Gaps that need **case data** (no way to add yet): richer cross-program data than E2E TE program 1 + 2, and values for LETTER, UNIT_INTERVAL, URL, USERNAME and DATETIME.
