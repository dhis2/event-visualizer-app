import { CheckboxField, type CheckboxFieldProps } from '@dhis2/ui'
import { useOptionsField } from '@hooks'
import { type FC } from 'react'
import type { OptionRecord } from './types'

type CheckboxBaseOptionProps = CheckboxFieldProps & {
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

    return (
        <div>
            <CheckboxField
                {...rest}
                checked={(inverted ? !value : value) as boolean}
                name={option.name}
                onChange={({ checked }) =>
                    setValue(inverted ? !checked : checked)
                }
                dense
                dataTest={dataTest}
            />
        </div>
    )
}
