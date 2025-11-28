import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type SelectBaseOptionProps = {
    label: string
    option: OptionRecord & { items: { label: string; value: string }[] }
    dataTest?: string
}

export const SelectBaseOption: FC<SelectBaseOptionProps> = ({
    option,
    label,
    dataTest,
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <div>
            <SingleSelectField
                label={label}
                onChange={({ selected }) => onChange(selected)}
                selected={String(value)}
                inputWidth="280px"
                dense
                dataTest={`${dataTest}-select`}
            >
                {option.items.map(({ value, label }) => (
                    <SingleSelectOption
                        key={value}
                        value={value}
                        label={label}
                        dataTest={`${dataTest}-option`}
                    />
                ))}
            </SingleSelectField>
        </div>
    )
}
