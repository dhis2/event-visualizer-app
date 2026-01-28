import i18n from '@dhis2/d2-i18n'
import { CircularLoader, Input, Layer, Popper } from '@dhis2/ui'
import { useCallback, useRef, useState } from 'react'
import { DataSourceSelectCombobox } from './data-source-select-combobox'
import { DataSourceSelectListbox } from './data-source-select-listbox'
import classes from './styles/data-source-select.module.css'
import { useDataSourceOptions } from './use-data-source-options'

export const DataSourceSelect = () => {
    const {
        error,
        filterString,
        isError,
        isLoading,
        onFilterStringChange,
        programs,
        trackedEntityTypes,
        hasMorePrograms,
        hasMoreTrackedEntityTypes,
        shouldShowFilter,
        onShowMoreProgramsClick,
        onShowMoreTrackedEntityTypesClick,
    } = useDataSourceOptions()
    const comboboxRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const closeDropDown = useCallback(() => {
        setIsOpen(false)
    }, [])

    return (
        <>
            <DataSourceSelectCombobox
                isError={isError}
                isOpen={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                comboboxRef={comboboxRef}
            />
            {isOpen && (
                <Layer onBackdropClick={closeDropDown}>
                    <Popper
                        reference={comboboxRef}
                        placement="bottom-start"
                        observeReferenceResize
                    >
                        <div
                            className={classes.dropdown}
                            style={{
                                width: comboboxRef.current?.scrollWidth ?? 260,
                            }}
                        >
                            {isLoading ? (
                                <div className={classes.loadingMessage}>
                                    <CircularLoader extrasmall />
                                    {i18n.t('Loading options')}
                                </div>
                            ) : isError ? (
                                <div className={classes.errorMessage}>
                                    {error?.message ||
                                        i18n.t('Failed to load data sources.')}
                                </div>
                            ) : (
                                <>
                                    {shouldShowFilter && (
                                        <div className={classes.filterWrapper}>
                                            <Input
                                                dense
                                                type="search"
                                                aria-label={i18n.t(
                                                    'Filter data sources'
                                                )}
                                                value={filterString}
                                                onChange={onFilterStringChange}
                                                placeholder={i18n.t(
                                                    'Type to filter…'
                                                )}
                                            />
                                        </div>
                                    )}
                                    <DataSourceSelectListbox
                                        programs={programs}
                                        trackedEntityTypes={trackedEntityTypes}
                                        hasMorePrograms={hasMorePrograms}
                                        hasMoreTrackedEntityTypes={
                                            hasMoreTrackedEntityTypes
                                        }
                                        onShowMoreProgramsClick={
                                            onShowMoreProgramsClick
                                        }
                                        onShowMoreTrackedEntityTypesClick={
                                            onShowMoreTrackedEntityTypesClick
                                        }
                                        closeDropdown={closeDropDown}
                                    />
                                </>
                            )}
                        </div>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
