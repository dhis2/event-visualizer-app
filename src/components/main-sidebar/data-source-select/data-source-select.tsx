import i18n from '@dhis2/d2-i18n'
import {
    CircularLoader,
    IconChevronDown16,
    IconChevronUp16,
    IconErrorFilled24,
    Input,
    Layer,
    Popper,
    theme,
} from '@dhis2/ui'
import cx from 'classnames'
import React, { useRef, useState } from 'react'
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
    const [selectedId, setSelectedId] = useState<string | null>(null)

    return (
        <>
            <div className={classes.comboboxWrap}>
                <div
                    ref={comboboxRef}
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls="data-source-listbox"
                    tabIndex={0}
                    className={cx(
                        classes.combobox,
                        isError && classes.comboboxError
                    )}
                    onClick={() => setIsOpen((open) => !open)}
                >
                    <span>{i18n.t('Choose a data source')}</span>
                    <span className={classes.chevronWrap} aria-hidden="true">
                        {isOpen ? <IconChevronUp16 /> : <IconChevronDown16 />}
                    </span>
                </div>
                {isError && <IconErrorFilled24 color={theme.error} />}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <Layer onBackdropClick={() => setIsOpen(false)}>
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
                                    <ul
                                        role="listbox"
                                        id="data-source-listbox"
                                        className={classes.listbox}
                                    >
                                        {programs.length > 0 && (
                                            <li
                                                role="presentation"
                                                className={
                                                    classes.sectionHeader
                                                }
                                                id="programs-header"
                                            >
                                                {i18n.t('Programs')}
                                            </li>
                                        )}
                                        {programs.length === 0 &&
                                            trackedEntityTypes.length === 0 && (
                                                <li
                                                    role="presentation"
                                                    className={
                                                        classes.emptyMessage
                                                    }
                                                >
                                                    {i18n.t(
                                                        'No data sources available'
                                                    )}
                                                </li>
                                            )}
                                        {programs.map((program) => (
                                            <li
                                                key={program.id}
                                                role="option"
                                                aria-selected={
                                                    selectedId === program.id
                                                }
                                                id={program.id}
                                                tabIndex={-1}
                                                className={cx(
                                                    classes.option,
                                                    selectedId === program.id &&
                                                        classes.optionActive
                                                )}
                                                onClick={() => {
                                                    setSelectedId(program.id)
                                                    setIsOpen(false)
                                                }}
                                            >
                                                {program.name}
                                            </li>
                                        ))}
                                        {hasMorePrograms && (
                                            <li
                                                role="presentation"
                                                className={
                                                    classes.showMoreWrapper
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={
                                                        classes.showMoreButton
                                                    }
                                                    onClick={
                                                        onShowMoreProgramsClick
                                                    }
                                                >
                                                    {i18n.t(
                                                        'Show more programs'
                                                    )}
                                                </button>
                                            </li>
                                        )}

                                        {trackedEntityTypes.length > 0 && (
                                            <li
                                                role="presentation"
                                                className={
                                                    classes.sectionHeader
                                                }
                                                id="tracked-entity-header"
                                            >
                                                {i18n.t('Tracked Entity Types')}
                                            </li>
                                        )}

                                        {trackedEntityTypes.map((type) => (
                                            <li
                                                key={type.id}
                                                role="option"
                                                aria-selected={
                                                    selectedId === type.id
                                                }
                                                id={type.id}
                                                tabIndex={-1}
                                                className={cx(
                                                    classes.option,
                                                    selectedId === type.id &&
                                                        classes.optionActive
                                                )}
                                                onClick={() => {
                                                    setSelectedId(type.id)
                                                    setIsOpen(false)
                                                }}
                                            >
                                                {type.name}
                                            </li>
                                        ))}
                                        {hasMoreTrackedEntityTypes && (
                                            <li
                                                role="presentation"
                                                className={
                                                    classes.showMoreWrapper
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={
                                                        classes.showMoreButton
                                                    }
                                                    onClick={
                                                        onShowMoreTrackedEntityTypesClick
                                                    }
                                                >
                                                    {i18n.t(
                                                        'Show more other data source'
                                                    )}
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                </>
                            )}
                        </div>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
