import { Checkbox } from '@dhis2/ui'
import { type FC } from 'react'
import type { OptionRecord } from './types'
import { useOptionsField } from '@hooks'

type CheckboxBaseOptionProps = {
    label: string
    option: OptionRecord
    dataTest?: string
    inverted?: boolean
}

export const CheckboxBaseOption: FC<CheckboxBaseOptionProps> = ({
    option,
    label,
    inverted,
    dataTest = option.name,
}) => {
    const [value, setValue] = useOptionsField(option.name)

    const onChange = (value) => setValue(value)

    return (
        <div>
            <Checkbox
                checked={Boolean(inverted ? !value : value)}
                label={label}
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
