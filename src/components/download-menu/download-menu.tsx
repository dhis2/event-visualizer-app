import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuItem, MenuSectionHeader } from '@dhis2/ui'
import type { FC } from 'react'
import { PlainDataSourceSubMenu } from './plain-data-source-sub-menu'
import type { DownloadFn } from './types'
import { HoverMenuList, HoverMenuListItem } from '@dhis2/analytics'

type DownloadMenuProps = {
    download: DownloadFn
    hoverable?: boolean
}

export const DownloadMenu: FC<DownloadMenuProps> = ({
    download,
    hoverable,
}) => {
    const config = useConfig()
    const MenuComponent = hoverable ? HoverMenuList : FlyoutMenu
    const MenuItemComponent = hoverable ? HoverMenuListItem : MenuItem

    return (
        <MenuComponent>
            <MenuSectionHeader
                label={i18n.t('HTML')}
                hideDivider
                dense={hoverable}
            />
            <MenuItemComponent
                label={i18n.t('HTML+CSS (.html+css)')}
                onClick={() => download('table', 'html+css')}
                className="push-analytics-download-as-html-css-menu-item"
            />
            <MenuSectionHeader
                label={i18n.t('Plain data source')}
                dense={hoverable}
            />
            <PlainDataSourceSubMenu
                hoverable={hoverable}
                download={download}
                label={i18n.t('JSON')}
                format={'json'}
            />
            <PlainDataSourceSubMenu
                hoverable={hoverable}
                download={download}
                label={i18n.t('XML')}
                format={'xml'}
            />
            <PlainDataSourceSubMenu
                hoverable={hoverable}
                download={download}
                label={i18n.t('Microsoft Excel')}
                format={
                    // VERSION-TOGGLE: remove when 42 is lowest supported version
                    (config.serverVersion?.minor ?? 0) >= 42 ? 'xlsx' : 'xls'
                }
            />
            <PlainDataSourceSubMenu
                hoverable={hoverable}
                download={download}
                label={i18n.t('CSV')}
                format={'csv'}
            />
        </MenuComponent>
    )
}
