import i18n from '@dhis2/d2-i18n'
import {
    Checkbox,
    Radio,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useCallback, useState, type FC } from 'react'
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

    const onLegendSetChange = useCallback(
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
        <>
            <Checkbox
                checked={Boolean(value)}
                label={i18n.t('Use a legend for table cell colors')}
                name="legendEnabled"
                onChange={onChange}
                dense
            />
            {isPopulatedLegendOption(value) && (
                <>
                    <LegendDisplayStyle
                        style={value.style}
                        onChange={onStyleChange}
                    />
                    <LegendDisplayStrategy
                        strategy={value.strategy}
                        onChange={onStrategyChange}
                    />
                    <LegendSet set={value.set} onChange={onLegendSetChange} />
                </>
            )}
        </>
    )
}

const LegendDisplayStrategy: FC<{
    strategy: LegendOption['strategy']
    onChange: (strategy: LegendOption['strategy']) => void
}> = ({ strategy, onChange }) => {
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

    return strategyOptions.map(({ id, label }) => (
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
    ))
}

const LegendDisplayStyle: FC<{
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

    return styleOptions.map(({ id, label }) => (
        <Radio
            name="style"
            key={id}
            label={label}
            value={id}
            checked={style === id}
            onChange={({ value }) => onChange(value as LegendOption['style'])}
            dense
            dataTest={`legend-style-option-${id}`}
        />
    ))
}

const fieldsFilter = [
    'id',
    'name',
    'legends[id,displayName~rename(name),startValue,endValue,color]',
] as const

type LegendSetsData = PickWithFieldFilters<LegendSet, typeof fieldsFilter>

const LegendSet: FC<{
    set?: LegendOption['set']
    onChange: (set: LegendOption['set']) => void
}> = ({ set, onChange }) => {
    const [trigger, { data, isLoading }] = useRtkLazyQuery<LegendSetsData>()

    const [legendSetOptions, setLegendSetOptions] = useState(
        [] as { value: string; label: string }[]
    )

    if (set?.id) {
        if (!legendSetOptions.find((option) => option.value === set.id)) {
            setLegendSetOptions([
                ...legendSetOptions,
                { value: set.id, label: set.displayName },
            ])
        }
    }

    const onFocus = useCallback(() => {
        if (!data) {
            trigger({
                resource: 'legendSets',
                params: { fields: [...fieldsFilter], paging: false },
            })
        }
    }, [data, trigger])

    console.log('data', data)
    return (
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
                            (option) => option.value === selected
                        )?.label ?? '',
                })
            }
            dataTest={'legend-set-select'}
        >
            {Array.isArray(data?.legends)
                ? data.legends.map(({ id, name }) => (
                      <SingleSelectOption
                          key={id}
                          value={id}
                          label={name}
                          dataTest={'legend-set-option'}
                      />
                  ))
                : null}
        </SingleSelectField>
    )
}
