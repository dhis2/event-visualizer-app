import type { FC } from 'react'
import type { FilterSelection } from './build-filters'
import { ORG_UNITS, PERIODS, YOUR_DIMENSIONS } from './fixtures'

type FilterControlsProps = {
    selection: FilterSelection
    onChange: (selection: FilterSelection) => void
}

/* Native elements, not DHIS2 UI's SingleSelectField/InputField: those render
 * without an underlying <select>/<input>, which cy.select()/cy.type() need. */
export const FilterControls: FC<FilterControlsProps> = ({
    selection,
    onChange,
}) => (
    <div
        data-test="plugin-host-filters"
        style={{ display: 'grid', gap: 8, maxWidth: 420 }}
    >
        <div>
            <label
                htmlFor="plugin-host-org-unit-select"
                style={{ display: 'block', marginBottom: 4 }}
            >
                Org unit
            </label>
            <select
                id="plugin-host-org-unit-select"
                data-test="plugin-host-org-unit-select"
                value={selection.orgUnitId ?? ''}
                onChange={(event) =>
                    onChange({
                        ...selection,
                        orgUnitId: event.target.value || undefined,
                    })
                }
            >
                <option value="">None</option>
                {ORG_UNITS.map(({ id, name }) => (
                    <option key={id} value={id}>
                        {name ?? id}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label
                htmlFor="plugin-host-period-select"
                style={{ display: 'block', marginBottom: 4 }}
            >
                Period
            </label>
            <select
                id="plugin-host-period-select"
                data-test="plugin-host-period-select"
                value={selection.periodId ?? ''}
                onChange={(event) =>
                    onChange({
                        ...selection,
                        periodId: event.target.value || undefined,
                    })
                }
            >
                <option value="">None</option>
                {PERIODS.map(({ id, name }) => (
                    <option key={id} value={id}>
                        {name ?? id}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label
                htmlFor="plugin-host-your-dimension-select"
                style={{ display: 'block', marginBottom: 4 }}
            >
                Your dimension
            </label>
            <select
                id="plugin-host-your-dimension-select"
                data-test="plugin-host-your-dimension-select"
                value={selection.yourDimensionKey ?? ''}
                onChange={(event) =>
                    onChange({
                        ...selection,
                        yourDimensionKey: event.target.value || undefined,
                    })
                }
            >
                <option value="">None</option>
                {YOUR_DIMENSIONS.map(({ key, label }) => (
                    <option key={key} value={key}>
                        {label}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label
                htmlFor="plugin-host-relative-period-date"
                style={{ display: 'block', marginBottom: 4 }}
            >
                relativePeriodDate (interpretation modal)
            </label>
            <input
                id="plugin-host-relative-period-date"
                data-test="plugin-host-relative-period-date"
                type="text"
                value={selection.relativePeriodDate ?? ''}
                onChange={(event) =>
                    onChange({
                        ...selection,
                        relativePeriodDate: event.target.value || undefined,
                    })
                }
            />
        </div>
    </div>
)
