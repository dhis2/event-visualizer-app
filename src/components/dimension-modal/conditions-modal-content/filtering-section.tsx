import { ShowAllFilterRadio } from '@components/dimension-modal/show-all-filter-radio/show-all-filter-radio'
import { useFilterRadioMode } from '@components/dimension-modal/show-all-filter-radio/use-filter-radio-mode'
import { valueTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import { type FC, useCallback } from 'react'
import { Conditions } from './conditions'
import { useConditions } from './conditions-provider'
import classes from './styles/conditions-modal-content.module.css'

type FilteringSectionProps = {
    showHeading: boolean
}

export const FilteringSection: FC<FilteringSectionProps> = ({
    showHeading,
}) => {
    const {
        dimension,
        conditions,
        conditionsList,
        valueType,
        isLegendSetCondition,
        isSingleCondition,
        isSupported,
        addCondition,
        storeConditions,
    } = useConditions()

    const onEnterShowAll = useCallback(
        () => storeConditions([]),
        [storeConditions]
    )

    const onEnterFilter = useCallback(
        () => storeConditions(conditionsList),
        [conditionsList, storeConditions]
    )

    const { mode, onModeChange } = useFilterRadioMode({
        hasPersistedFilter: Boolean(conditions.condition?.length),
        onEnterShowAll,
        onEnterFilter,
    })

    const filterDisabledHelp = valueType
        ? i18n.t('{{valueType}} type dimensions cannot be filtered.', {
              valueType: valueTypeDisplayNames[valueType],
          })
        : i18n.t('This dimension cannot be filtered.')

    const heading = showHeading ? i18n.t('Filtering') : undefined
    const showAllLabel = isLegendSetCondition
        ? i18n.t('Show all groups')
        : undefined

    if (!isSupported) {
        return (
            <ShowAllFilterRadio
                mode="SHOW_ALL"
                onModeChange={() => {
                    /* unfilterable dimensions are always "Show all" */
                }}
                heading={heading}
                dataTest={`conditions-${dimension.id}-filter-radio`}
                filterDisabled
                filterDisabledHelp={filterDisabledHelp}
            />
        )
    }

    return (
        <ShowAllFilterRadio
            mode={mode}
            onModeChange={onModeChange}
            heading={heading}
            showAllLabel={showAllLabel}
            dataTest={`conditions-${dimension.id}-filter-radio`}
        >
            <div className={classes.mainSection}>
                <Conditions />
                {!isSingleCondition && (
                    <Button
                        type="button"
                        small
                        onClick={addCondition}
                        dataTest="button-add-condition"
                    >
                        {i18n.t('Add filter')}
                    </Button>
                )}
            </div>
        </ShowAllFilterRadio>
    )
}
