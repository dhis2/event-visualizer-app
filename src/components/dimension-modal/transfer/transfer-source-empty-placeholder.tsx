import i18n from '@dhis2/d2-i18n'
import type { Transfer } from '@dhis2/ui'
import type { FC, ComponentProps } from 'react'
import classes from './styles/transfer.module.css'

type TransferSourceEmptyPlaceholderProps = {
    dataTest: string
    loading: boolean
    options: ComponentProps<typeof Transfer>['options']
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
