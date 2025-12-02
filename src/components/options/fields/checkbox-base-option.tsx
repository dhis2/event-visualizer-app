import { Checkbox, type CheckboxProps } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type CheckboxBaseOptionProps = CheckboxProps & {
    option: OptionRecord
    inverted?: boolean
}

export const CheckboxBaseOption: FC<CheckboxBaseOptionProps> = ({
    option,
    inverted,
    dataTest = option.name,
    ...rest
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <div>
            <Checkbox
                {...rest}
                checked={(inverted ? !value : value) as boolean}
                name={option.name}
                onChange={({ checked }) =>
                    onChange(inverted ? !checked : checked)
                }
                dense
                dataTest={dataTest}
            />
        </div>
    )
}
