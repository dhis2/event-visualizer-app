import { FieldSet, Legend, Help } from '@dhis2/ui'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/options-fieldset.module.css'

type OptionsFieldSetProps = {
    title?: string
    helpText?: string
}

export const OptionsFieldSet: FC<PropsWithChildren<OptionsFieldSetProps>> = ({
    title,
    helpText,
    children,
}) => {
    return (
        <div className={classes.fieldSet}>
            <FieldSet>
                {title ? (
                    <Legend>
                        <span className={classes.fieldSetTitle}>{title}</span>
                    </Legend>
                ) : null}
                <div className={classes.fieldSetContent}>
                    {children}
                    {helpText ? (
                        <Legend>
                            <Help>{helpText}</Help>
                        </Legend>
                    ) : null}
                </div>
            </FieldSet>
        </div>
    )
}
