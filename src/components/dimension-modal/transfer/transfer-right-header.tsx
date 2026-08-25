import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import classes from './styles/transfer.module.css'

export const TransferRightHeader: FC<{ title?: string }> = ({ title }) => (
    <p className={classes.transferRightHeader}>
        {title ?? i18n.t('Selected options')}
    </p>
)
