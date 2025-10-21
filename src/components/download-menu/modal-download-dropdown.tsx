import i18n from '@dhis2/d2-i18n'
import { DropdownButton } from '@dhis2/ui'
import { useState, useCallback, type FC } from 'react'
import { DownloadMenu } from './download-menu'
import classes from './styles/modal-download-dropdown.module.css'
import { useDownload } from './use-download'

type ModalDownloadDropdownProps = {
    relativePeriodDate: string
}

export const ModalDownloadDropdown: FC<ModalDownloadDropdownProps> = ({
    relativePeriodDate,
}) => {
    const { isDownloadDisabled, download } = useDownload(relativePeriodDate)
    const [isOpen, setIsOpen] = useState(false)
    const toggleOpen = useCallback(() => {
        setIsOpen((currentIsOpen) => !currentIsOpen)
    }, [])

    return (
        <div className={classes.container}>
            <DropdownButton
                component={<DownloadMenu download={download} />}
                disabled={isDownloadDisabled}
                onClick={toggleOpen}
                open={isOpen}
                secondary
                small
            >
                {i18n.t('Download data from this date')}
            </DropdownButton>
        </div>
    )
}
