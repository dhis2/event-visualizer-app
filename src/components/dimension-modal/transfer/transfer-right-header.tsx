import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import classes from './styles/transfer.module.css'

type TransferRightHeaderProps = {
    title?: string
}

export const TransferRightHeader: FC<TransferRightHeaderProps> = ({
    title,
}) => (
    <p className={classes.transferRightHeader}>
        {title ?? i18n.t('Selected options')}
    </p>
)
