import cx from 'classnames'
import { DataSourceSelect } from './data-source-select/data-source-select'
import classes from './styles/main-sidebar.module.css'
import { useAppSelector } from '@hooks'
import { getUiMainSidebarVisible } from '@store/ui-slice'

export const MainSidebar = () => {
    const isMainSidebarVisible = useAppSelector(getUiMainSidebarVisible)
    return (
        <div
            className={cx(classes.container, {
                [classes.hidden]: !isMainSidebarVisible,
            })}
        >
            <DataSourceSelect />
        </div>
    )
}
