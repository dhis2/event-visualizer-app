import { Field, Radio, type RadioProps } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type RadioBaseOptionProps = RadioProps & {
    option: OptionRecord & { items: { id: string; label: string }[] }
}

export const RadioBaseOption: FC<RadioBaseOptionProps> = ({
    option,
    dataTest = option.name,
    ...rest
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <Field name={option.name}>
            {option.items.map(({ id, label }) => (
                <Radio
                    {...rest}
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
