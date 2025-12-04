import i18n from '@dhis2/d2-i18n'
import { Checkbox } from '@dhis2/ui'
import { useCallback, useMemo, type FC } from 'react'
import { SelectBaseOption } from './select-base-option'
import classes from './styles/option.module.css'
import { TextBaseOption } from './text-base-option'
import { useOptionsField } from '@hooks'

export const Limit: FC = () => {
    const [sortOrder, setSortOrder] = useOptionsField('sortOrder')
    const [topLimit, setTopLimit] = useOptionsField('topLimit')

    const isLimitEnabled = useMemo(
        () => sortOrder !== undefined && topLimit !== undefined,
        [sortOrder, topLimit]
    )

    const onChange = useCallback(
        ({ checked }) => {
            setSortOrder(checked ? -1 : undefined)
            setTopLimit(checked ? 10 : undefined)
        },
        [setSortOrder, setTopLimit]
    )

    return (
        <div>
            <Checkbox
                checked={isLimitEnabled}
                label={i18n.t('Limit')}
                name="limitEnabled"
                onChange={onChange}
                dense
            />
            {isLimitEnabled && (
                <div className={classes.optionToggleable}>
                    <SortOrder />
                    <TopLimit />
                </div>
            )}
        </div>
    )
}

const SortOrder: FC = () => (
    <SelectBaseOption
        label={i18n.t('Sort order')}
        option={{
            name: 'sortOrder',
            items: [
                { value: '-1', label: i18n.t('Low to high') },
                { value: '1', label: i18n.t('High to low') },
            ],
        }}
    />
)

const TopLimit = () => (
    <TextBaseOption
        label={i18n.t('Top limit')}
        type="number"
        min="1"
        option={{ name: 'topLimit' }}
    />
)
