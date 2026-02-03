import i18n from '@dhis2/d2-i18n'
import {
    IconChevronDown16,
    IconChevronUp16,
    IconDimensionEventDataItem16,
    IconErrorFilled24,
    theme,
} from '@dhis2/ui'
import cx from 'classnames'
import { type KeyboardEvent, useCallback } from 'react'
import classes from './styles/data-source-select-combobox.module.css'
import { useAppSelector, useMetadataItem } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'

export type DataSourceSelectComboboxProps = {
    isError: boolean
    isOpen: boolean
    onClick: () => void
    comboboxRef: React.RefObject<HTMLDivElement>
}

export const DataSourceSelectCombobox = ({
    isError,
    isOpen,
    onClick,
    comboboxRef,
}: DataSourceSelectComboboxProps) => {
    const selectedId = useAppSelector(getDataSourceId)
    const dataSourceMetadata = useMetadataItem(selectedId)
    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.code === 'Enter' || event.code === 'Space') {
                event.preventDefault()
                onClick()
            }
        },
        [onClick]
    )

    return (
        <div className={classes.comboboxWrap}>
            <div
                ref={comboboxRef}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls="data-source-listbox"
                tabIndex={0}
                className={cx(classes.combobox, {
                    [classes.error]: isError,
                })}
                onClick={onClick}
                onKeyDown={onKeyDown}
            >
                <span
                    className={cx(classes.label, {
                        [classes.empty]: !dataSourceMetadata,
                    })}
                >
                    {!!dataSourceMetadata && <IconDimensionEventDataItem16 />}
                    <span className={classes.ellipsis}>
                        {dataSourceMetadata?.name ??
                            i18n.t('Choose a data source')}
                    </span>
                </span>
                <span className={classes.chevronWrap} aria-hidden="true">
                    {isOpen ? <IconChevronUp16 /> : <IconChevronDown16 />}
                </span>
            </div>
            {isError && <IconErrorFilled24 color={theme.error} />}
        </div>
    )
}
