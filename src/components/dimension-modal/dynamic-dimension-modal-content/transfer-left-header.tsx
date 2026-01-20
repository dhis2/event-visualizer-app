import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import { type FC } from 'react'
import classes from './styles/dynamic-dimension-modal-content.module.css'

type TransferLeftHeaderProps = {
    dataTest: string
    searchTerm?: string
    setSearchTerm: (searchTerm?: string) => void
}

export const TransferLeftHeader: FC<TransferLeftHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    dataTest,
}) => (
    <div className={classes.transferLeftHeader}>
        <p className={classes.transferLeftTitle}>
            {i18n.t('Available options')}
        </p>
        <InputField
            value={searchTerm}
            onChange={({ value }) => setSearchTerm(value)}
            placeholder={i18n.t('Filter options')}
            dataTest={`${dataTest}-filter-input-field`}
            dense
            initialFocus
            type="search"
        />
    </div>
)
