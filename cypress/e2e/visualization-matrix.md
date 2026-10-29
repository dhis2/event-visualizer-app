# E2E visualization matrix

The type 1 E2E tests run a set of saved visualizations through the same steps: render in the app, create and show an interpretation, render in the plugin host. This document lists the kinds of visualization the app can make, which saved visualizations cover them, and whether the DB (`analytics-with-ever-20261014`) has data to build them.

## What a visualization varies by

The main axes, crossed in the matrix below:

- **Vis type:** line list or pivot table.
- **Output type:** event, enrollment or tracked entity. A pivot table can't use tracked entity output.
- **Data source shape:** what the dimensions in the layout come from. One layout can mix data sources, and the output type decides which mixes are valid:
    - Event: one program and one stage (an event program, or one stage of a tracker program), plus that program's enrollment dimensions and tracked entity attributes.
    - Enrollment: one tracker program, any number of its stages.
    - Tracked entity: one tracked entity type, any number of its programs, or no program at all.
- **Pivot table cell value:** a plain count, or a numeric data element or tracked entity attribute aggregated in each cell.

Secondary features don't need to be crossed with every row. Each one only needs to show up somewhere in the set (see [Secondary features](#secondary-features)).

## Matrix

"Visualizations" lists the saved visualizations that cover the row. An ID is a visualization in the DB dump. A name in `code` is a file in `visualization-metadata-import/visualizations/`, which the import adds on top of the dump. "Legacy" means a visualization saved by an older app, which loads in a different shape. "Data in DB" says whether the DB dump has the data to build a suitable visualization.

### Line list

| #   | Output         | Data source shape                                            | Visualizations                                                 | Data in DB                                                                                                |
| --- | -------------- | ------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| L1  | Event          | Event program                                                | `event-line-list-event-program`; legacy: 6 Event Reports lists | Yes: Inpatient morbidity and mortality, 108k events                                                       |
| L2  | Event          | One stage of a tracker program                               | `IZJmG9NHTtj`                                                  | Yes: Child Programme, Birth                                                                               |
| L3  | Event          | Tracker stage + enrollment dimensions + attributes           | `Unf7gi4ShzQ` (no attributes), `C1XaMuNaeDy`                   | Yes: Child Programme                                                                                      |
| L4  | Enrollment     | One stage + enrollment dimensions                            | `qSc4vbYPPgk`, `C524QgkjodB`                                   | Yes: Child Programme                                                                                      |
| L5  | Enrollment     | Several stages of one program                                | `enrollment-line-list-several-stages`                          | Yes: Child Programme (Birth + Baby Postnatal), E2E TE program 1 (3 stages)                                |
| L6  | Enrollment     | Repeated events                                              | `XCLdIcUmenR` (14 events), `WrIV7ZoYECj`                       | Yes: WHO RMNCH 2nd ANC visit, E2E TE program 1 stage 2                                                    |
| L7  | Tracked entity | Tracked entity type only (attributes, registration org unit) | `cRuVDbe3Lga`, `qTd4CrFQ4hz`                                   | Yes: Person, 74k tracked entities                                                                         |
| L8  | Tracked entity | Tracked entity type + one program                            | `cHhlOdJqqox`, `GOIpY8GFUJp`                                   | Yes: Person + Child Programme                                                                             |
| L9  | Tracked entity | Tracked entity type + two programs (cross program)           | `tracked-entity-line-list-two-programs`                        | Yes, one option: Person + E2E TE program 1 and 2 (630 tracked entities with values in both, Jan–Feb 2026) |

### Pivot table

| #   | Output     | Data source shape                                          | Cell value   | Visualizations                                                                                               | Data in DB                                                            |
| --- | ---------- | ---------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| P1  | Event      | Event program                                              | Count        | `event-pivot-table-event-program`; legacy: 24                                                                | Yes: Inpatient morbidity and mortality                                |
| P2  | Event      | Event program                                              | Data element | `event-pivot-table-data-element-value`; legacy: `aDrb9UMVxt0`                                                | Yes: Inpatient, Weight in kg                                          |
| P3  | Event      | Event program with categories / category option group sets | Count        | `event-pivot-table-categories`; legacy: 4                                                                    | Yes: Malaria testing and surveillance, 10k events                     |
| P4  | Event      | Tracker stage + enrollment dimensions                      | Count        | `pb8yapu3EVC`, `TKrpEtzneOk`                                                                                 | Yes: Child Programme                                                  |
| P5  | Event      | Tracker stage + attributes + registration org unit         | Count        | `event-pivot-table-attributes-registration-org-unit`                                                         | Yes: Child Programme / Person                                         |
| P6  | Event      | Tracker stage                                              | Data element | `event-pivot-table-tracker-stage-data-element-value`                                                         | Yes: Child Programme, MCH Weight (g)                                  |
| P7  | Enrollment | One or more stages + enrollment dimensions                 | Count        | `enrollment-pivot-table-several-stages`                                                                      | Yes: Child Programme                                                  |
| P8  | Enrollment | One or more stages                                         | Data element | `enrollment-pivot-table-data-element-value` (fails: the backend does not store the value's stage, see below) | Yes: WHO RMNCH, Hemoglobin value                                      |
| P9  | Enrollment | Stage + attributes                                         | Attribute    | `enrollment-pivot-table-attribute-value`                                                                     | Yes: TB program, Weight in kg (AGE attributes cannot be a cell value) |

### Not supported by the app

The app blocks these combinations, whatever the data:

- Pivot table with tracked entity output.
- Event output with several stages or several programs.
- Enrollment output on an event program, or with categories / category option group sets.
- Several tracked entity types in one visualization.
- Program indicators in a pivot table (as a dimension or as the cell value).

### Legacy

The dump has 31 legacy line lists and pivot tables. Loading them takes a separate code path. That is worth a type 1 test of its own, using a couple of the dump visualizations as they are. The 19 legacy charts can't be opened by the app and are out of scope.

## Secondary features

| Feature                                            | Visualizations                                                                                                                                                             | Data in DB                                                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Program indicators (line list)                     | `event-line-list-event-program`, `enrollment-line-list-several-stages`                                                                                                     | Yes: Inpatient (20), Child Programme (10)                                                                                                 |
| Group by legend set                                | `event-pivot-table-event-program` (Age in years)                                                                                                                           | Data elements only: Age in years (2 legend sets), Weight in kg, Height in cm. No legend sets on attributes or program indicators          |
| Legend display by data item (line list)            | `event-line-list-event-program` (no colours show, see below)                                                                                                               | Yes                                                                                                                                       |
| Option sets                                        | Most of the new visualizations, `C1XaMuNaeDy`                                                                                                                              | Yes: Inpatient, Child Programme, WHO RMNCH                                                                                                |
| Conditions                                         | Number `GE:18` in `event-line-list-event-program`, not empty `NE:NV` in `tracked-entity-line-list-two-programs`, boolean `EQ:1` in `enrollment-pivot-table-several-stages` | Most value types in E2E TE program 1 stage 3. No data for LETTER, UNIT_INTERVAL, URL, USERNAME, DATETIME outside the 14-event E2E program |
| Metadata dimensions                                | Last updated in `event-line-list-event-program`, created in `tracked-entity-line-list-two-programs`                                                                        | Yes                                                                                                                                       |
| Scheduled date, incident date                      | `enrollment-line-list-several-stages`                                                                                                                                      | Yes: Child Programme                                                                                                                      |
| Registration org unit in event / enrollment output | `event-pivot-table-attributes-registration-org-unit`                                                                                                                       | Yes: Person                                                                                                                               |
| Statuses with items                                | `event-pivot-table-tracker-stage-data-element-value` (enrollment status filter)                                                                                            | Yes                                                                                                                                       |
| Pivot table rows, totals and subtotals             | `event-pivot-table-event-program`, `enrollment-pivot-table-several-stages`                                                                                                 | Yes                                                                                                                                       |
| Hide empty rows                                    | `event-pivot-table-categories`                                                                                                                                             | Yes                                                                                                                                       |
| Show hierarchy                                     | `event-pivot-table-attributes-registration-org-unit`                                                                                                                       | Yes                                                                                                                                       |
| Org unit group sets                                | Legacy only                                                                                                                                                                | Yes                                                                                                                                       |
| Cumulative values, limit, sorting                  | None                                                                                                                                                                       | Yes                                                                                                                                       |

A start–end date range is left out: its dates are fixed, so the yearly date shift (see below) would move the data out of it.

## Known problems

- `enrollment-pivot-table-data-element-value` fails with "Value `vANAXwtLwcT` must be a data element prefixed with a program stage". The app saves the value's stage (`value.programStage`), but the backend on idv-e2e-setup (2.44-SNAPSHOT, revision `1a536f8`) does not store it. An event pivot table gets away without the stage; an enrollment pivot table does not.
- `event-line-list-event-program` asks for legend colours by data item, but the app makes no `legendSets` request when it loads the line list, so no colours show.

## Data notes

- Data runs from 2025 into 2027 (Child Programme and WHO RMNCH have 2027 events). A yearly SQL script moves all dates in the DB forward, so the E2E visualizations use relative periods (`THIS_YEAR`, `LAST_12_MONTHS`), not fixed periods, which would end up outside the data.
- Some programs are too small to be useful: Antenatal care visit (3 events), Information Campaign (6), Provider Follow-up (6), MNCH / PNC (11), XX MAL RDT (0). TB program has 50k enrollments but only 46 events, so it suits enrollment and tracked entity output only.
- Gaps that need **metadata only** (easy to add): a legend set on a tracked entity attribute or a program indicator.
- Gaps that need **case data** (no way to add yet): richer cross-program data than E2E TE program 1 + 2, and values for LETTER, UNIT_INTERVAL, URL, USERNAME and DATETIME.
