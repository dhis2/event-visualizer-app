import cx from 'classnames'
import { CardsProgramWithRegistration } from './cards-program-with-registration/cards-program-with-registration'
import { CardsProgramWithoutRegistration } from './cards-program-without-registration/cards-program-without-registration'
import { CardsTrackedEntityType } from './cards-tracked-entity-type/cards-tracked-entity-type'
import { DataSourceSelect } from './data-source-select/data-source-select'
import { CardMetadata } from './dimension-card/card-metadata'
import { CardOther } from './dimension-card/card-other'
import { FilterDropdownButton } from './filter-dropdown-button'
import classes from './styles/main-sidebar.module.css'
import { ToggleCollapseAllButton } from './toggle-collapse-all-button'
import { UnifiedSearchInput } from './unified-search-input'
import { useAppSelector, useMetadataItem } from '@hooks'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceProgramWithoutRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getUiMainSidebarVisible } from '@store/ui-slice'

export const MainSidebar = () => {
    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSourceMetadataItem = useMetadataItem(dataSourceId)

    return (
        <div
            className={cx(classes.container, {
                [classes.hidden]: !isMainSidebarVisible,
            })}
        >
            <DataSourceSelect />
            {!!dataSourceMetadataItem && (
                <>
                    <div className={classes.searchRow}>
                        <UnifiedSearchInput />
                        {isDataSourceProgramWithRegistration(
                            dataSourceMetadataItem
                        ) && <FilterDropdownButton />}
                        <ToggleCollapseAllButton />
                    </div>
                    <div className={classes.dimensionCardsContainer}>
                        {isDataSourceProgramWithRegistration(
                            dataSourceMetadataItem
                        ) && (
                            <CardsProgramWithRegistration
                                program={dataSourceMetadataItem}
                            />
                        )}
                        {isDataSourceProgramWithoutRegistration(
                            dataSourceMetadataItem
                        ) && (
                            <CardsProgramWithoutRegistration
                                program={dataSourceMetadataItem}
                            />
                        )}
                        {isDataSourceTrackedEntityType(
                            dataSourceMetadataItem
                        ) && (
                            <CardsTrackedEntityType
                                trackedEntityType={dataSourceMetadataItem}
                            />
                        )}
                        <CardMetadata />
                        <CardOther />
                    </div>
                </>
            )}
        </div>
    )
}
