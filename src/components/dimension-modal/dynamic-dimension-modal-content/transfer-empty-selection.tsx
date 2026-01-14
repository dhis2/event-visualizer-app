import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import classes from './styles/dynamic-dimension-modal-content.module.css'

export const TransferEmptySelection: FC = () => (
    <p className={classes.transferEmptyList}>{i18n.t('No items selected')}</p>
)
