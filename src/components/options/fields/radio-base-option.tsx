import { Field, Radio } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type RadioBaseOptionProps = {
    option: OptionRecord & { items: { id: string; label: string }[] }
    dataTest?: string
}

export const RadioBaseOption: FC<RadioBaseOptionProps> = ({
    option,
    dataTest,
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <Field name={option.name}>
            {option.items.map(({ id, label }) => (
                <Radio
                    name={option.name}
                    key={id}
                    label={label}
                    value={id}
                    checked={value === id}
                    onChange={({ value }) => onChange(value)}
                    dense
                    dataTest={`${dataTest}-option-${id}`}
                />
            ))}
        </Field>
    )
}
