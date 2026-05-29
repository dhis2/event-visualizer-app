import { HoverMenuListItem } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { MenuItem, MenuSectionHeader } from '@dhis2/ui'
import type { FC } from 'react'
import type { DownloadFn } from './types'

type AdvancedSubMenuProps = {
    download: DownloadFn
    label: string
    hoverable?: boolean
}

export const AdvancedSubMenu: FC<AdvancedSubMenuProps> = ({
    download,
    hoverable = false,
    label,
}) => {
    const MenuItemComponent = hoverable ? HoverMenuListItem : MenuItem

    return (
        <MenuItemComponent label={label}>
            <MenuSectionHeader
                label={i18n.t('Data value set')}
                dense={hoverable}
                hideDivider
            />
            <MenuItemComponent
                label={i18n.t('JSON')}
                onClick={() =>
                    download({
                        type: 'plain',
                        format: 'json',
                        path: 'dataValueSet',
                    })
                }
            />
            <MenuItemComponent
                label={i18n.t('XML')}
                onClick={() =>
                    download({
                        type: 'plain',
                        format: 'xml',
                        path: 'dataValueSet',
                    })
                }
            />
            <MenuSectionHeader
                label={i18n.t('Other formats')}
                dense={hoverable}
            />
            <MenuItemComponent
                label={i18n.t('JRXML')}
                onClick={() =>
                    download({
                        type: 'plain',
                        format: 'jrxml',
                    })
                }
            />
            <MenuItemComponent
                label={i18n.t('Raw data SQL')}
                onClick={() =>
                    download({
                        type: 'plain',
                        format: 'sql',
                        path: 'debug/sql',
                    })
                }
            />
        </MenuItemComponent>
    )
}
