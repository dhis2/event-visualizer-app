import type { HostFilters } from '@types'
import { ORG_UNITS, PERIODS, YOUR_DIMENSIONS } from './fixtures'

export type FilterSelection = {
    orgUnitId?: string
    periodId?: string
    yourDimensionKey?: string
    relativePeriodDate?: string
}

export const buildHostFilters = ({
    orgUnitId,
    periodId,
    yourDimensionKey,
    relativePeriodDate,
}: FilterSelection): HostFilters => {
    const orgUnit = ORG_UNITS.find(({ id }) => id === orgUnitId)
    const period = PERIODS.find(({ id }) => id === periodId)
    const yourDimension = YOUR_DIMENSIONS.find(
        ({ key }) => key === yourDimensionKey
    )

    return {
        ...(orgUnit ? { ou: [orgUnit] } : {}),
        ...(period ? { pe: [period] } : {}),
        ...(yourDimension
            ? {
                  yourDimensions: {
                      [yourDimension.dimensionId]: [yourDimension.item],
                  },
              }
            : {}),
        ...(relativePeriodDate ? { relativePeriodDate } : {}),
    }
}
