import { HoverMenuListItem } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { MenuItem, MenuSectionHeader } from '@dhis2/ui'
import type { FC } from 'react'
import type { DownloadFn, FileFormat } from './types'

type PlainDataSourceSubMenuProps = {
    download: DownloadFn
    format: FileFormat
    label: string
    hoverable?: boolean
}

export const PlainDataSourceSubMenu: FC<PlainDataSourceSubMenuProps> = ({
    download,
    hoverable = false,
    format,
    label,
    ...menuItemProps
}) => {
    const MenuItemComponent = hoverable ? HoverMenuListItem : MenuItem

    return (
        <MenuItemComponent label={label} {...menuItemProps}>
            <MenuSectionHeader
                label={i18n.t('Metadata ID scheme')}
                hideDivider
                dense={hoverable}
            />
            <MenuItemComponent
                label={i18n.t('ID')}
                onClick={() =>
                    download({ type: 'plain', format, idScheme: 'UID' })
                }
            />
            <MenuItemComponent
                label={i18n.t('Code')}
                onClick={() =>
                    download({ type: 'plain', format, idScheme: 'CODE' })
                }
            />
            <MenuItemComponent
                label={i18n.t('Name')}
                onClick={() =>
                    download({ type: 'plain', format, idScheme: 'NAME' })
                }
            />
        </MenuItemComponent>
    )
}
