import type {
    CurrentVisualization,
    DataSourceProgramWithoutRegistration,
    DataSourceProgramWithRegistration,
    MetadataItem,
} from '@types'
import { isMetadataItem, isProgramMetadataItem } from './metadata'
import { isPopulatedString } from './validation'
import { getSingleProgramFromVisualization } from './visualization'

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

export const getTrackedEntityTypeIdFromDataSource = (
    dataSource: unknown
): string | null => {
    if (isDataSourceProgramWithRegistration(dataSource)) {
        return dataSource.trackedEntityType.id
    }
    if (isDataSourceTrackedEntityType(dataSource)) {
        return dataSource.id
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
