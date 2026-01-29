import { isMetadataItemWithName, isProgramMetadataItem } from './metadata'
import { isPopulatedString } from './validation'
import type {
    CurrentVisualization,
    DataSource,
    DataSourceProgramWithoutRegistration,
    DataSourceProgramWithRegistration,
    MetadataItemWithName,
} from '@types'

export const isDataSourceProgramWithRegistration = (
    dataSource: DataSource
): dataSource is DataSourceProgramWithRegistration =>
    isProgramMetadataItem(dataSource) &&
    dataSource.programType === 'WITH_REGISTRATION'

export const isDataSourceProgramWithoutRegistration = (
    dataSource: DataSource
): dataSource is DataSourceProgramWithoutRegistration =>
    isProgramMetadataItem(dataSource) &&
    dataSource.programType === 'WITHOUT_REGISTRATION'

export const isDataSourceTrackedEntity = (
    dataSource: DataSource
): dataSource is MetadataItemWithName =>
    !isProgramMetadataItem(dataSource) && isMetadataItemWithName(dataSource)

export const extractDataSourceIdFromVisualization = ({
    outputType,
    program,
    programDimensions,
    trackedEntityType,
}: CurrentVisualization): string => {
    if (outputType === 'ENROLLMENT' || outputType === 'EVENT') {
        // 'ENROLLMENT' and 'EVENT' are single program, so we look at the `program` field
        if (isPopulatedString(program?.id)) {
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
