import i18n from '@dhis2/d2-i18n'
import React, { FC } from 'react'

type HelloProps = { name?: string }

export const Hello: FC<HelloProps> = ({ name = 'Unknown Visitor' }) => (
    <h1>{i18n.t('Hello {{name}}', { name })}</h1>
)
