import i18n from '@dhis2/d2-i18n'
import { MenuItem, MenuSectionHeader } from '@dhis2/ui'
import type { FC } from 'react'
import { DownloadFn, FileFormat } from './types'
import { HoverMenuListItem } from '@dhis2/analytics'

type PlainDataSourceSubMenuProps = {
    download: DownloadFn
    format: FileFormat
    label: string
    hoverable?: boolean
}

export const PlainDataSourceSubMenu: FC<PlainDataSourceSubMenuProps> = ({
    download,
    hoverable,
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
                onClick={() => download('plain', format, 'UID')}
            />
            <MenuItemComponent
                label={i18n.t('Code')}
                onClick={() => download('plain', format, 'CODE')}
            />
            <MenuItemComponent
                label={i18n.t('Name')}
                onClick={() => download('plain', format, 'NAME')}
            />
        </MenuItemComponent>
    )
}
