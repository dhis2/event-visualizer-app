import { InputField, type InputProps, type InputFieldProps } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type TextBaseOptionProps = {
    dataTest?: InputFieldProps['dataTest']
    disabled?: InputFieldProps['disabled']
    label: InputFieldProps['label']
    option: OptionRecord
    placeholder: InputFieldProps['placeholder']
    type: InputFieldProps['type']
    width: InputProps['width']
}

export const TextBaseOption: FC<TextBaseOptionProps> = ({
    type,
    label,
    option,
    placeholder,
    width,
    disabled,
    dataTest = option.name,
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <div>
            <InputField
                type={type}
                label={label}
                onChange={({ value }) => onChange(value)}
                name={option.name}
                value={value ? String(value) : ''}
                placeholder={placeholder}
                inputWidth={width}
                dense
                disabled={disabled}
                dataTest={`${dataTest}-input`}
            />
        </div>
    )
}
