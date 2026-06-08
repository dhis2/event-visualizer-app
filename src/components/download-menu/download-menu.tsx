import { HoverMenuList, HoverMenuListItem } from '@dhis2/analytics'
import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuItem, MenuSectionHeader } from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { FC } from 'react'
import { AdvancedSubMenu } from './advanced-sub-menu'
import { PlainDataSourceSubMenu } from './plain-data-source-sub-menu'
import type { DownloadFn } from './types'

type DownloadMenuProps = {
    download: DownloadFn
    hoverable?: boolean
}

export const DownloadMenu: FC<DownloadMenuProps> = ({
    download,
    hoverable = false,
}) => {
    const config = useConfig()
    const visType = useAppSelector(getVisUiConfigVisualizationType)

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
                onClick={() => download({ type: 'table', format: 'html+css' })}
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
            {visType === 'PIVOT_TABLE' && (
                <AdvancedSubMenu
                    hoverable={hoverable}
                    download={download}
                    label={i18n.t('Advanced')}
                />
            )}
        </MenuComponent>
    )
}
