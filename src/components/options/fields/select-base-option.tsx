import {
    SingleSelectField,
    SingleSelectOption,
    type SingleSelectFieldProps,
} from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type SelectBaseOptionProps = SingleSelectFieldProps & {
    option: OptionRecord & { items: { label: string; value: string }[] }
}

export const SelectBaseOption: FC<SelectBaseOptionProps> = ({
    option,
    dataTest = option.name,
    inputWidth = '280px',
    ...rest
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <div>
            <SingleSelectField
                {...rest}
                onChange={({ selected }) => onChange(selected)}
                // Cast to String because values might be numeric but the UI component only accepts string | undefined
                selected={
                    value !== undefined && value !== null
                        ? String(value)
                        : undefined
                }
                inputWidth={inputWidth}
                dense
                dataTest={`${dataTest}-select`}
            >
                {option.items.map(({ value, label }) => (
                    <SingleSelectOption
                        key={value}
                        value={value}
                        label={label}
                        dataTest={`${dataTest}-option-${value}`}
                    />
                ))}
            </SingleSelectField>
        </div>
    )
}
