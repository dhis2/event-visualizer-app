import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import { DownloadMenu as BaseDownloadMenu } from '@components/download-menu/download-menu'
import { useDownload } from '@components/download-menu/use-download'
import { HoverMenuDropdown } from '@dhis2/analytics'

export const DownloadMenu: FC = () => {
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
