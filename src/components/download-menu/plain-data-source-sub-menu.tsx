import { HoverMenuListItem } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { MenuItem, MenuSectionHeader } from '@dhis2/ui'
import React, { FC } from 'react'
import {
    DOWNLOAD_TYPE_PLAIN,
    ID_SCHEME_UID,
    ID_SCHEME_CODE,
    ID_SCHEME_NAME,
} from './constants'

type PlainDataSourceSubMenuProps = {
    download: (type: string, format: string, idScheme: string) => void
    format: string
    label: string
    hoverable?: boolean
}

const PlainDataSourceSubMenu: FC<PlainDataSourceSubMenuProps> = ({
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
                onClick={() =>
                    download(DOWNLOAD_TYPE_PLAIN, format, ID_SCHEME_UID)
                }
            />
            <MenuItemComponent
                label={i18n.t('Code')}
                onClick={() =>
                    download(DOWNLOAD_TYPE_PLAIN, format, ID_SCHEME_CODE)
                }
            />
            <MenuItemComponent
                label={i18n.t('Name')}
                onClick={() =>
                    download(DOWNLOAD_TYPE_PLAIN, format, ID_SCHEME_NAME)
                }
            />
        </MenuItemComponent>
    )
}

export default PlainDataSourceSubMenu
