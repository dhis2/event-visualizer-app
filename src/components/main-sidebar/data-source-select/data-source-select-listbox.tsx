import i18n from '@dhis2/d2-i18n'
import { DataSourceSelectOption } from './data-source-select-option'
import classes from './styles/data-source-select-listbox.module.css'
import type { UseDataSourceOptionsResult } from './use-data-source-options'

export type DataSourceSelectListboxProps = Pick<
    UseDataSourceOptionsResult,
    | 'hasMorePrograms'
    | 'hasMoreTrackedEntityTypes'
    | 'onShowMoreProgramsClick'
    | 'onShowMoreTrackedEntityTypesClick'
    | 'programs'
    | 'trackedEntityTypes'
> & {
    closeDropdown: () => void
}

export const DataSourceSelectListbox = ({
    closeDropdown,
    hasMorePrograms,
    hasMoreTrackedEntityTypes,
    onShowMoreProgramsClick,
    onShowMoreTrackedEntityTypesClick,
    programs,
    trackedEntityTypes,
}: DataSourceSelectListboxProps) => (
    <ul role="listbox" id="data-source-listbox" className={classes.listbox}>
        {programs.length === 0 && trackedEntityTypes.length === 0 && (
            <li role="presentation" className={classes.emptyMessage}>
                {i18n.t('No data sources available')}
            </li>
        )}
        {programs.length > 0 && (
            <li role="presentation" className={classes.sectionHeader}>
                {i18n.t('Programs')}
            </li>
        )}
        {programs.map((program) => (
            <DataSourceSelectOption
                key={program.id}
                option={program}
                closeDropdown={closeDropdown}
            />
        ))}
        {hasMorePrograms && (
            <li role="presentation" className={classes.showMoreWrapper}>
                <button
                    tabIndex={0}
                    type="button"
                    className={classes.showMoreButton}
                    onClick={onShowMoreProgramsClick}
                >
                    {i18n.t('Show more')}
                </button>
            </li>
        )}
        {trackedEntityTypes.length > 0 && (
            <li role="presentation" className={classes.sectionHeader}>
                {i18n.t('Analyze without a program')}
            </li>
        )}
        {trackedEntityTypes.map((tet) => (
            <DataSourceSelectOption
                key={tet.id}
                option={tet}
                closeDropdown={closeDropdown}
            />
        ))}
        {hasMoreTrackedEntityTypes && (
            <li role="presentation" className={classes.showMoreWrapper}>
                <button
                    tabIndex={0}
                    type="button"
                    className={classes.showMoreButton}
                    onClick={onShowMoreTrackedEntityTypesClick}
                >
                    {i18n.t('Show more')}
                </button>
            </li>
        )}
    </ul>
)
