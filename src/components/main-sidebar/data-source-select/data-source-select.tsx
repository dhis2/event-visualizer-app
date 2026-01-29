import i18n from '@dhis2/d2-i18n'
import { CircularLoader, Input, Layer, Popper } from '@dhis2/ui'
import { type KeyboardEvent, useCallback, useRef, useState } from 'react'
import { DataSourceSelectCombobox } from './data-source-select-combobox'
import { DataSourceSelectListbox } from './data-source-select-listbox'
import classes from './styles/data-source-select.module.css'
import { useDataSourceOptions } from './use-data-source-options'

const focusFirstFocusableChild = (node: HTMLDivElement) => {
    const firstFocusableChild = node?.querySelector(
        'input[type="search"], li[tabindex="0"]'
    ) as HTMLElement

    if (firstFocusableChild) {
        requestAnimationFrame(() => {
            firstFocusableChild?.focus()
        })
    }
}

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
    const toggleDropdownIsOpen = useCallback(() => {
        setIsOpen((currentIsOpen) => !currentIsOpen)
    }, [])
    const closeWithEsc = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.code === 'Escape') {
                event.preventDefault()
                toggleDropdownIsOpen()
            }
        },

        [toggleDropdownIsOpen]
    )

    return (
        <>
            <DataSourceSelectCombobox
                isError={isError}
                isOpen={isOpen}
                onClick={toggleDropdownIsOpen}
                comboboxRef={comboboxRef}
            />
            {isOpen && (
                <Layer onBackdropClick={toggleDropdownIsOpen}>
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
                            tabIndex={0}
                            ref={focusFirstFocusableChild}
                            onKeyDown={closeWithEsc}
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
                                        closeDropdown={toggleDropdownIsOpen}
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
