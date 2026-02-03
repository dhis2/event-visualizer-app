import cx from 'classnames'
import { DataSourceSelect } from './data-source-select/data-source-select'
import { FilterDropdownButton } from './filter-dropdown-button'
import classes from './styles/main-sidebar.module.css'
import { UnifiedSearchInput } from './unified-search-input'
import { useAppSelector, useMetadataItem } from '@hooks'
import { isDataSourceProgramWithRegistration } from '@modules/data-source'
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
                <div className={classes.searchRow}>
                    <UnifiedSearchInput />
                    {isDataSourceProgramWithRegistration(
                        dataSourceMetadataItem
                    ) && <FilterDropdownButton />}
                </div>
            )}
        </div>
    )
}
