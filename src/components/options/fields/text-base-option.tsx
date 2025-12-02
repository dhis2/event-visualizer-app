import { InputField, type InputFieldProps } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type TextBaseOptionProps = InputFieldProps & {
    option: OptionRecord
}

export const TextBaseOption: FC<TextBaseOptionProps> = ({
    option,
    dataTest = option.name,
    ...rest
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <div>
            <InputField
                {...rest}
                onChange={({ value }) => onChange(value)}
                name={option.name}
                value={value as string | undefined}
                dense
                dataTest={`${dataTest}-input`}
            />
        </div>
    )
}
