import type { FilterItem } from '@types'

export type VisualizationFixture = {
    id: string
    label: string
    type: 'LINE_LIST' | 'PIVOT_TABLE'
}

export const VISUALIZATIONS: VisualizationFixture[] = [
    {
        id: 'TIuOzZ0ID0V',
        label: 'Inpatient: Cases 5 to 15 years this year',
        type: 'LINE_LIST',
    },
    {
        id: 'PRVegIpABeb',
        label: 'Inpatient: Visit overview this year Bo',
        type: 'LINE_LIST',
    },
    {
        id: 'R4wAb2yMLik',
        label: 'Inpatient: Cases last quarter',
        type: 'LINE_LIST',
    },
    {
        id: 'aDrb9UMVxt0',
        label: 'Inpatient: Average weight by discharge mode and gender',
        type: 'PIVOT_TABLE',
    },
]

/* Covers the value kinds, not just examples: a plain uid, the user's own org
 * units, a level, and a group. Each is handled differently by analytics. */
export const ORG_UNITS: FilterItem[] = [
    { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
    { id: 'O6uvpzGd5pu', name: 'Bo' },
    { id: 'fdc6uOvgoji', name: 'Bombali' },
    { id: 'USER_ORGUNIT', name: 'User org unit' },
    { id: 'LEVEL-2', name: 'District level' },
    { id: 'OU_GROUP-J40PpdN4Wkk', name: 'Group: Northern Area' },
]

/* A fixed period and a relative one. Only relative periods make
 * relativePeriodDate meaningful. */
export const PERIODS: FilterItem[] = [
    { id: '202401', name: 'January 2024' },
    { id: 'THIS_YEAR', name: 'This year' },
    { id: 'LAST_12_MONTHS', name: 'Last 12 months' },
]

export type YourDimensionFixture = {
    /* `<dimensionUid>:<itemUid>`, so one select can carry both */
    key: string
    label: string
    dimensionId: string
    item: FilterItem
}

/* One org unit group set, which every program accepts, and one category, which
 * only programs using it accept. The category is deliberately one the Inpatient
 * visualizations do not use: applying it would fail the analytics request, which
 * makes it a useful case once filters are actually applied. */
export const YOUR_DIMENSIONS: YourDimensionFixture[] = [
    {
        key: 'uIuxlbV1vRT:J40PpdN4Wkk',
        label: 'Area: Northern Area',
        dimensionId: 'uIuxlbV1vRT',
        item: { id: 'J40PpdN4Wkk', name: 'Northern Area' },
    },
    {
        key: 'LFsZ8v5v7rq:C6nZpLKjEJr',
        label: 'Implementing Partner: AMREF',
        dimensionId: 'LFsZ8v5v7rq',
        item: {
            id: 'C6nZpLKjEJr',
            name: 'African Medical and Research Foundation',
        },
    },
]
