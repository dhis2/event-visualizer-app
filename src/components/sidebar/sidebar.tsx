import { useAppSelector, useMetadataItem } from '@hooks'
import {
    isDataSourceProgramWithRegistration,
    isDataSourceProgramWithoutRegistration,
    isDataSourceTrackedEntityType,
} from '@modules/data-source'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getUiSidebarVisible } from '@store/ui-slice'
import cx from 'classnames'
import { type UIEvent, useState, type FC } from 'react'
import { CardMetadata } from './card-metadata'
import { CardOther } from './card-other'
import { CardsProgramWithRegistration } from './cards-program-with-registration/cards-program-with-registration'
import { CardsProgramWithoutRegistration } from './cards-program-without-registration/cards-program-without-registration'
import { CardsTrackedEntityType } from './cards-tracked-entity-type/cards-tracked-entity-type'
import { DataSourceSelect } from './data-source-select/data-source-select'
import { FilterDropdownButton } from './filter-dropdown-button'
import classes from './styles/sidebar.module.css'
import { ToggleCollapseAllButton } from './toggle-collapse-all-button'
import { UnifiedSearchInput } from './unified-search-input'
import { useResizableSidebar } from './use-resizable-sidebar'

export const Sidebar: FC = () => {
    const isSidebarVisible = useAppSelector(getUiSidebarVisible)
    const dataSourceId = useAppSelector(getDataSourceId)
    const dataSourceMetadataItem = useMetadataItem(dataSourceId)
    const [isScrolled, setIsScrolled] = useState(false)
    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget
        setIsScrolled(target.scrollTop > 0)
    }

    const { containerRef, isDragging, width, eventHandlers } =
        useResizableSidebar()

    return (
        <div
            ref={containerRef}
            className={cx(classes.container, {
                [classes.hidden]: !isSidebarVisible,
            })}
            style={{ inlineSize: width }}
        >
            <DataSourceSelect />
            {!!dataSourceMetadataItem && (
                <>
                    <div
                        className={cx(classes.searchRow, {
                            [classes.scrolled]: isScrolled,
                        })}
                    >
                        <UnifiedSearchInput />
                        {isDataSourceProgramWithRegistration(
                            dataSourceMetadataItem
                        ) && <FilterDropdownButton />}
                        <ToggleCollapseAllButton />
                    </div>
                    <div
                        onScroll={handleScroll}
                        className={classes.dimensionCardsContainer}
                        data-dnd-auto-scroll="disabled"
                    >
                        {isDataSourceProgramWithRegistration(
                            dataSourceMetadataItem
                        ) && (
                            <CardsProgramWithRegistration
                                key={dataSourceMetadataItem.id}
                                program={dataSourceMetadataItem}
                            />
                        )}
                        {isDataSourceProgramWithoutRegistration(
                            dataSourceMetadataItem
                        ) && (
                            <CardsProgramWithoutRegistration
                                key={dataSourceMetadataItem.id}
                                program={dataSourceMetadataItem}
                            />
                        )}
                        {isDataSourceTrackedEntityType(
                            dataSourceMetadataItem
                        ) && (
                            <CardsTrackedEntityType
                                key={dataSourceMetadataItem.id}
                                trackedEntityType={dataSourceMetadataItem}
                            />
                        )}
                        <CardMetadata />
                        <CardOther />
                    </div>
                </>
            )}
            <div
                className={cx(classes.resizeHandle, {
                    [classes.active]: isDragging,
                })}
                {...eventHandlers}
            />
        </div>
    )
}
