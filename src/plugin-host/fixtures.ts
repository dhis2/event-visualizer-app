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
