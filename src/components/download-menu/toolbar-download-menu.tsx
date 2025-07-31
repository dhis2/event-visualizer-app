import { HoverMenuDropdown } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import React from 'react'
import DownloadMenu from './download-menu'
import { useDownload } from './use-download'

const ToolbarDownloadMenu = () => {
    const { isDownloadDisabled, download } = useDownload()

    return (
        <HoverMenuDropdown
            label={i18n.t('Download')}
            disabled={isDownloadDisabled}
            className="push-analytics-download-dropdown-menu-button"
        >
            <DownloadMenu download={download} hoverable />
        </HoverMenuDropdown>
    )
}

export default ToolbarDownloadMenu
