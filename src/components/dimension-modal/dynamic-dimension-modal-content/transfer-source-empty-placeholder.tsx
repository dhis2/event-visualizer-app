import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { type TransferItemRecord } from './dynamic-dimension-modal-content'
import classes from './styles/dynamic-dimension-modal-content.module.css'

type TransferSourceEmptyPlaceholderProps = {
    dataTest: string
    loading: boolean
    options: TransferItemRecord[]
    searchTerm?: string
}

export const TransferSourceEmptyPlaceholder: FC<
    TransferSourceEmptyPlaceholderProps
> = ({ loading, searchTerm, options, dataTest }) =>
    !loading &&
    !options.length && (
        <p className={classes.transferEmptyList} data-test={dataTest}>
            {searchTerm
                ? i18n.t('Nothing found for "{{- searchTerm}}"', {
                      searchTerm: searchTerm,
                  })
                : i18n.t('No options')}
        </p>
    )
