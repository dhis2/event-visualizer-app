# Visualization metadata import

The E2E instances are built from the `analytics-with-ever-20261014` DB dump. The visualizations the E2E suite needs on top of that dump live in `visualizations/`, one metadata payload per file. Once the set has settled, they become part of a new DB dump and this folder goes away.

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
