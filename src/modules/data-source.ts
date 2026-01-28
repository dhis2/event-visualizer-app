import { isMetadataItemWithName, isProgramMetadataItem } from './metadata'
import type {
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
