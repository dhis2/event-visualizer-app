import cx from 'classnames'
import { DataSourceSelect } from './data-source-select/data-source-select'
import classes from './styles/main-sidebar.module.css'
import { UnifiedSearchInput } from './unified-search-input'
import { useAppSelector } from '@hooks'
import { getHasDataSource } from '@store/dimensions-selection-slice'
import { getUiMainSidebarVisible } from '@store/ui-slice'

export const MainSidebar = () => {
    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    const hasDataSource = useAppSelector(getHasDataSource)

    return (
        <div
            className={cx(classes.container, {
                [classes.hidden]: !isMainSidebarVisible,
            })}
        >
            <DataSourceSelect />
            {hasDataSource && (
                <div className={classes.searchRow}>
                    <UnifiedSearchInput />
                </div>
            )}
        </div>
    )
}
