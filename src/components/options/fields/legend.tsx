import i18n from '@dhis2/d2-i18n'
import {
    Checkbox,
    Radio,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useCallback, useMemo, type FC } from 'react'
import classes from './styles/option.module.css'
import { DEFAULT_LEGEND_OPTION } from '@constants/options'
import { useOptionsField, useRtkLazyQuery } from '@hooks'
import { isPopulatedLegendOption } from '@modules/options'
import type { LegendSet, PickWithFieldFilters, LegendOption } from '@types'

export const Legend: FC = () => {
    const [value, setValue] = useOptionsField('legend')

    const onChange = useCallback(
        ({ checked }) => setValue(checked ? DEFAULT_LEGEND_OPTION : undefined),
        [setValue]
    )

    const onShowKeyChange = useCallback(
        (showKey: LegendOption['showKey']) => setValue({ ...value!, showKey }),
        [value, setValue]
    )

    const onSetChange = useCallback(
        (set: LegendOption['set']) => setValue({ ...value!, set }),
        [value, setValue]
    )

    const onStrategyChange = useCallback(
        (strategy: LegendOption['strategy']) =>
            setValue({ ...value!, strategy }),
        [value, setValue]
    )

    const onStyleChange = useCallback(
        (style: LegendOption['style']) => setValue({ ...value!, style }),
        [value, setValue]
    )

    return (
        <div>
            <Checkbox
                checked={Boolean(value)}
                label={i18n.t('Use a legend for table cell colors')}
                name="legendEnabled"
                onChange={onChange}
                dense
            />
            {isPopulatedLegendOption(value) && (
                <div className={classes.optionToggleable}>
                    <LegendStyle style={value.style} onChange={onStyleChange} />
                    <LegendStrategy
                        strategy={value.strategy}
                        set={value.set}
                        onChange={onStrategyChange}
                        onSetChange={onSetChange}
                    />
                    <LegendShowKey
                        showKey={value.showKey}
                        onChange={onShowKeyChange}
                    />
                </div>
            )}
        </div>
    )
}

const LegendStrategy: FC<{
    strategy: LegendOption['strategy']
    set: LegendOption['set']
    onChange: (strategy: LegendOption['strategy']) => void
    onSetChange: (set: LegendOption['set']) => void
}> = ({ set, strategy, onChange, onSetChange }) => {
    const strategyOptions = [
        {
            id: 'BY_DATA_ITEM',
            label: i18n.t('Use pre-defined legend per data item'),
        },
        {
            id: 'FIXED',
            label: i18n.t(
                'Choose a single legend for the entire visualization'
            ),
        },
    ]

    return (
        <div>
            <span className={classes.optionTitle}>{i18n.t('Legend type')}</span>
            {strategyOptions.map(({ id, label }) => (
                <Radio
                    name="strategy"
                    key={id}
                    label={label}
                    value={id}
                    checked={strategy === id}
                    onChange={({ value }) =>
                        onChange(value as LegendOption['strategy'])
                    }
                    dense
                    dataTest={`legend-strategy-option-${id}`}
                />
            ))}
            {strategy === 'FIXED' && (
                <LegendSet set={set} onChange={onSetChange} />
            )}
        </div>
    )
}

const LegendStyle: FC<{
    style: LegendOption['style']
    onChange: (style: LegendOption['style']) => void
}> = ({ style, onChange }) => {
    const styleOptions = [
        {
            id: 'FILL',
            label: i18n.t('Legend changes background color'),
        },
        {
            id: 'TEXT',
            label: i18n.t('Legend changes text color'),
        },
    ]

    return (
        <div>
            <span className={classes.optionTitle}>
                {i18n.t('Legend style')}
            </span>
            {styleOptions.map(({ id, label }) => (
                <Radio
                    name="style"
                    key={id}
                    label={label}
                    value={id}
                    checked={style === id}
                    onChange={({ value }) =>
                        onChange(value as LegendOption['style'])
                    }
                    dense
                    dataTest={`legend-style-option-${id}`}
                />
            ))}
        </div>
    )
}

const fieldsFilter = [
    'id',
    'name',
    'legends[id,displayName~rename(name),startValue,endValue,color]',
] as const

type LegendSetItem = PickWithFieldFilters<LegendSet, typeof fieldsFilter> & {
    id: string
    name: string
}
type LegendSetsData = { legendSets: LegendSetItem[] }

const LegendSet: FC<{
    set?: LegendOption['set']
    onChange: (set: LegendOption['set']) => void
}> = ({ set, onChange }) => {
    const [trigger, { data, isLoading }] = useRtkLazyQuery<LegendSetsData>()

    const legendSetOptions: LegendSetItem[] = useMemo(() => {
        const options = [] as LegendSetItem[]

        if (Array.isArray(data?.legendSets)) {
            options.push(...data.legendSets)
        }

        if (set?.id) {
            if (!options.find((option) => option.id === set.id)) {
                options.push({
                    id: set.id,
                    name: set.displayName,
                } as LegendSetItem)
            }
        }

        return options
    }, [data?.legendSets, set])

    const onFocus = useCallback(() => {
        if (!data) {
            trigger({
                resource: 'legendSets',
                params: { fields: [...fieldsFilter], paging: false },
            })
        }
    }, [data, trigger])

    return (
        <div className={classes.optionToggleable}>
            <SingleSelectField
                label={i18n.t('Legend')}
                selected={set?.id}
                inputWidth="280px"
                placeholder={i18n.t('Select from legends')}
                loadingText={i18n.t('Loading legends')}
                loading={isLoading}
                dense
                onFocus={onFocus}
                onChange={({ selected }) =>
                    onChange({
                        id: selected,
                        displayName:
                            legendSetOptions.find(
                                (option) => option.id === selected
                            )?.name ?? '',
                    })
                }
                dataTest={'legend-set-select'}
            >
                {Array.isArray(legendSetOptions)
                    ? legendSetOptions.map(({ id, name }) => (
                          <SingleSelectOption
                              key={id}
                              value={id}
                              label={name}
                              dataTest={'legend-set-option'}
                          />
                      ))
                    : null}
            </SingleSelectField>
        </div>
    )
}

const LegendShowKey: FC<{
    showKey: LegendOption['showKey']
    onChange: (showKey: LegendOption['showKey']) => void
}> = ({ showKey, onChange }) => (
    <div>
        <Checkbox
            checked={Boolean(showKey)}
            label={i18n.t('Show legend key')}
            name="showKey"
            onChange={({ checked }) => onChange(checked)}
            dense
        />
    </div>
)
