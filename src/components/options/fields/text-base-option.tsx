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
    inputWidth = '280px',
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
                // Cast to String because value might be numeric but the UI component only accepts string | undefined
                value={
                    value !== undefined && value !== null
                        ? String(value)
                        : undefined
                }
                inputWidth={inputWidth}
                dense
                dataTest={`${dataTest}-input`}
            />
        </div>
    )
}
