import i18n from '@dhis2/d2-i18n'
import { Input } from '@dhis2/ui'
import cx from 'classnames'
import React, { useState } from 'react'
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
        onShowMoreProgramsClick,
        onShowMoreTrackedEntityTypesClick,
    } = useDataSourceOptions()

    const [isOpen, setIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    return (
        <div className={classes.root}>
            <div
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
                <span>{i18n.t('Select a data source')}</span>
                <span aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className={classes.dropdown}>
                    {isLoading ? (
                        <div className={classes.loadingMessage}>
                            {i18n.t('Loading data sources…')}
                        </div>
                    ) : isError ? (
                        <div className={classes.errorMessage}>
                            {error?.message ||
                                i18n.t('Failed to load data sources.')}
                        </div>
                    ) : (
                        <>
                            {/* Filter input */}
                            <div className={classes.filterWrapper}>
                                <Input
                                    dense
                                    type="search"
                                    aria-label={i18n.t('Filter data sources')}
                                    value={filterString}
                                    onChange={onFilterStringChange}
                                    placeholder={i18n.t('Type to filter…')}
                                />
                            </div>
                            <ul
                                role="listbox"
                                id="data-source-listbox"
                                className={classes.listbox}
                            >
                                {/* Programs Section */}
                                <li
                                    role="presentation"
                                    className={classes.sectionHeader}
                                    id="programs-header"
                                >
                                    {i18n.t('Programs')}
                                </li>
                                {programs.length === 0 && (
                                    <li
                                        role="presentation"
                                        className={classes.emptyMessage}
                                    >
                                        {i18n.t('No programs found.')}
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
                                        className={classes.showMoreWrapper}
                                    >
                                        <button
                                            type="button"
                                            className={classes.showMoreButton}
                                            onClick={onShowMoreProgramsClick}
                                        >
                                            {i18n.t('Show more…')}
                                        </button>
                                    </li>
                                )}

                                {/* Tracked Entity Types Section */}
                                <li
                                    role="presentation"
                                    className={classes.sectionHeader}
                                    id="tracked-entity-header"
                                >
                                    {i18n.t('Tracked Entity Types')}
                                </li>
                                {trackedEntityTypes.length === 0 && (
                                    <li
                                        role="presentation"
                                        className={classes.emptyMessage}
                                    >
                                        {i18n.t(
                                            'No tracked entity types found.'
                                        )}
                                    </li>
                                )}
                                {trackedEntityTypes.map((type) => (
                                    <li
                                        key={type.id}
                                        role="option"
                                        aria-selected={selectedId === type.id}
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
                                        className={classes.showMoreWrapper}
                                    >
                                        <button
                                            type="button"
                                            className={classes.showMoreButton}
                                            onClick={
                                                onShowMoreTrackedEntityTypesClick
                                            }
                                        >
                                            {i18n.t('Show more…')}
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
