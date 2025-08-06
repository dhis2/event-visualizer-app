import { HoverMenuDropdown } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import React, { FC } from 'react'
import { default as BaseDownloadMenu } from '../../download-menu/download-menu'
import { useDownload } from '../../download-menu/use-download'

const DownloadMenu: FC = () => {
    const { isDownloadDisabled, download } = useDownload()

    return (
        <HoverMenuDropdown
            label={i18n.t('Download')}
            disabled={isDownloadDisabled}
            className="push-analytics-download-dropdown-menu-button"
        >
            <BaseDownloadMenu download={download} hoverable />
        </HoverMenuDropdown>
    )
}

export default DownloadMenu
