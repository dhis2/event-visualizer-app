import i18n from '@dhis2/d2-i18n'
import {
    IconChevronDown16,
    IconChevronUp16,
    IconErrorFilled24,
    theme,
} from '@dhis2/ui'
import cx from 'classnames'
import classes from './styles/data-source-select-combobox.module.css'

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
}: DataSourceSelectComboboxProps) => (
    <div className={classes.comboboxWrap}>
        <div
            ref={comboboxRef}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls="data-source-listbox"
            tabIndex={0}
            className={cx(classes.combobox, isError && classes.comboboxError)}
            onClick={onClick}
        >
            <span className={classes.label}>
                {i18n.t('Choose a data source')}
            </span>
            <span className={classes.chevronWrap} aria-hidden="true">
                {isOpen ? <IconChevronUp16 /> : <IconChevronDown16 />}
            </span>
        </div>
        {isError && <IconErrorFilled24 color={theme.error} />}
    </div>
)
