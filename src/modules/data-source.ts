import type {
    DataSource,
    DataSourceProgramWithoutRegistration,
    DataSourceProgramWithRegistration,
    DataSourceTrackedEntity,
} from 'src/types/data-source'

export const isDataSourceProgramWithRegistration = (
    dataSource: DataSource
): dataSource is DataSourceProgramWithRegistration =>
    'programType' in dataSource &&
    dataSource.programType === 'WITH_REGISTRATION'

export const isDataSourceProgramWithoutRegistration = (
    dataSource: DataSource
): dataSource is DataSourceProgramWithoutRegistration =>
    'programType' in dataSource &&
    dataSource.programType === 'WITHOUT_REGISTRATION'

export const isDataSourceTrackedEntity = (
    dataSource: DataSource
): dataSource is DataSourceTrackedEntity => !('programType' in dataSource)
