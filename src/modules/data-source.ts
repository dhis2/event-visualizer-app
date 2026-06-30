import {
    isMetadataItem,
    isProgramMetadataItem,
} from '@modules/metadata/item-guards'
import { isPopulatedString } from '@modules/utils/guards'
import { getSingleProgramFromVisualization } from '@modules/visualization/program'
import type {
    CurrentVisualization,
    DataSourceProgramWithoutRegistration,
    DataSourceProgramWithRegistration,
    MetadataItem,
} from '@types'

export const isDataSourceProgramWithRegistration = (
    dataSource: unknown
): dataSource is DataSourceProgramWithRegistration =>
    isProgramMetadataItem(dataSource) &&
    dataSource.programType === 'WITH_REGISTRATION'

export const isDataSourceProgramWithoutRegistration = (
    dataSource: unknown
): dataSource is DataSourceProgramWithoutRegistration =>
    isProgramMetadataItem(dataSource) &&
    dataSource.programType === 'WITHOUT_REGISTRATION'

export const isDataSourceTrackedEntityType = (
    dataSource: unknown
): dataSource is MetadataItem =>
    !isProgramMetadataItem(dataSource) && isMetadataItem(dataSource)

/* The tracked entity type a data source belongs to: a tracker program's own
 * TET, or the TET data source itself. Event programs have no TET → null. */
export const getDataSourceTet = (
    dataSource: MetadataItem | undefined
): { id: string; name: string } | null => {
    if (isDataSourceProgramWithRegistration(dataSource)) {
        return {
            id: dataSource.trackedEntityType.id,
            name: dataSource.trackedEntityType.name,
        }
    }
    if (isDataSourceTrackedEntityType(dataSource)) {
        return { id: dataSource.id, name: dataSource.name }
    }
    return null
}

export const extractDataSourceIdFromVisualization = (
    visualization: CurrentVisualization
): string => {
    const { outputType, programDimensions, trackedEntityType } = visualization

    if (outputType === 'ENROLLMENT' || outputType === 'EVENT') {
        // 'ENROLLMENT' and 'EVENT' are single program — look it up in programDimensions
        const program = getSingleProgramFromVisualization(visualization)
        if (isPopulatedString(program.id)) {
            return program.id
        }
    } else if (outputType === 'TRACKED_ENTITY_INSTANCE') {
        // TEI output can have several programs and a TET
        if (Array.isArray(programDimensions) && programDimensions.length > 0) {
            // We prefer to select the first program data source (sorted alphabetically)
            const firstProgram =
                programDimensions.length === 1
                    ? programDimensions[0]
                    : [...programDimensions].sort((a, b) =>
                          a.name.localeCompare(b.name)
                      )[0]

            if (isPopulatedString(firstProgram.id)) {
                return firstProgram.id
            }
        } else if (isPopulatedString(trackedEntityType?.id)) {
            // If no program data source is present we show the TET data source
            return trackedEntityType.id
        }
    }

    throw new Error(
        'No data source could be extracted from visualization object'
    )
}
