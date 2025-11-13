import i18n from '@dhis2/d2-i18n'
import { idsToUids } from './visualization'
import {
    getCreatedDimension,
    getMainDimensions,
    getProgramDimensions,
    getTimeDimensions,
} from '@modules/dimension'
import type { Status, SavedVisualization } from '@types'

export const getStatusNames = (): Record<Status, string> => ({
    ACTIVE: i18n.t('Active'),
    CANCELLED: i18n.t('Cancelled'),
    COMPLETED: i18n.t('Completed'),
    SCHEDULE: i18n.t('Scheduled'),
})

type StatusesMetadata = Record<Status, Record<Status, string>>
export const getStatusesMetadata = (): StatusesMetadata =>
    Object.entries(getStatusNames()).reduce((acc, [key, value]) => {
        acc[key] = { [key]: value }
        return acc
    }, {} as StatusesMetadata)

export const getDefaultTimeDimensionsMetadata = () =>
    Object.values(getTimeDimensions()).reduce(
        (acc, { id, dimensionType, defaultName }) => {
            acc[id] = {
                uid: id,
                name: defaultName,
                dimensionType,
            }
            return acc
        },
        {}
    )

export const getDefaultMetadata = (visualization: SavedVisualization) => ({
    ...idsToUids(getMainDimensions(visualization.outputType)),
    ...idsToUids(getCreatedDimension()),
    ...idsToUids(getProgramDimensions(visualization.program.id)),
    ...getDefaultTimeDimensionsMetadata(),
    ...getStatusesMetadata(),
})
