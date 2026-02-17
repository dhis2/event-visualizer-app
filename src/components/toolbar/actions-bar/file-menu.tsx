import i18n from '@dhis2/d2-i18n'
import {
    IconSave24,
    IconEdit24,
    IconTranslate24,
    IconShare24,
    IconLink24,
    IconDelete24,
    colors,
    MenuDivider,
} from '@dhis2/ui'
import { useMemo, type FC } from 'react'
import { NewButton } from './new-button'
import { OpenButton } from './open-button'
import { SaveButton } from './save-button'
import {
    HoverMenuListItem,
    HoverMenuList,
    HoverMenuDropdown,
} from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { isVisualizationValidForSaveAs } from '@modules/validation'
import { isVisualizationSaved } from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'

type FileMenuProps = {
    onMenuItemClick: (dialogName: string) => void
}

export const FileMenu: FC<FileMenuProps> = ({ onMenuItemClick }) => {
    const currentVis = useAppSelector(getCurrentVis)

    const isOnSaveAsEnabled = useMemo(
        () => isVisualizationValidForSaveAs(currentVis),
        [currentVis]
    )

    const iconActiveColor = colors.grey700
    const iconInactiveColor = colors.grey500

    return (
        <HoverMenuDropdown label={i18n.t('File')}>
            <HoverMenuList dataTest="file-menu-container">
                <NewButton />
                <MenuDivider dense />
                <OpenButton onClick={() => onMenuItemClick('open')} />
                <SaveButton />
                <HoverMenuListItem
                    label={i18n.t('Save as…')}
                    icon={
                        <IconSave24
                            color={
                                isOnSaveAsEnabled
                                    ? iconActiveColor
                                    : iconInactiveColor
                            }
                        />
                    }
                    disabled={!isOnSaveAsEnabled}
                    onClick={() => onMenuItemClick('saveas')}
                    dataTest="file-menu-saveas"
                />
                <HoverMenuListItem
                    label={i18n.t('Rename…')}
                    icon={
                        <IconEdit24
                            color={
                                isVisualizationSaved(currentVis) &&
                                currentVis?.access?.update
                                    ? iconActiveColor
                                    : iconInactiveColor
                            }
                        />
                    }
                    disabled={
                        !(
                            isVisualizationSaved(currentVis) &&
                            currentVis?.access?.update
                        )
                    }
                    onClick={() => onMenuItemClick('rename')}
                    dataTest="file-menu-rename"
                />
                <HoverMenuListItem
                    label={i18n.t('Translate…')}
                    icon={
                        <IconTranslate24
                            color={
                                isVisualizationSaved(currentVis) &&
                                currentVis?.access?.update
                                    ? iconActiveColor
                                    : iconInactiveColor
                            }
                        />
                    }
                    disabled={
                        !(
                            isVisualizationSaved(currentVis) &&
                            currentVis?.access?.update
                        )
                    }
                    onClick={() => onMenuItemClick('translate')}
                    dataTest="file-menu-translate"
                />
                <MenuDivider dense />
                <HoverMenuListItem
                    label={i18n.t('Share…')}
                    icon={
                        <IconShare24
                            color={
                                isVisualizationSaved(currentVis) &&
                                currentVis?.access?.manage
                                    ? iconActiveColor
                                    : iconInactiveColor
                            }
                        />
                    }
                    disabled={
                        !(
                            isVisualizationSaved(currentVis) &&
                            currentVis?.access?.manage
                        )
                    }
                    onClick={() => onMenuItemClick('sharing')}
                    dataTest="file-menu-sharing"
                />
                <HoverMenuListItem
                    label={i18n.t('Get link…')}
                    icon={
                        <IconLink24
                            color={
                                isVisualizationSaved(currentVis)
                                    ? iconActiveColor
                                    : iconInactiveColor
                            }
                        />
                    }
                    disabled={!isVisualizationSaved(currentVis)}
                    onClick={() => onMenuItemClick('getlink')}
                    dataTest="file-menu-getlink"
                />
                <MenuDivider dense />
                <HoverMenuListItem
                    label={i18n.t('Delete')}
                    destructive
                    icon={
                        <IconDelete24
                            color={
                                isVisualizationSaved(currentVis) &&
                                currentVis?.access?.delete
                                    ? colors.red700
                                    : iconInactiveColor
                            }
                        />
                    }
                    disabled={
                        !(
                            isVisualizationSaved(currentVis) &&
                            currentVis?.access?.delete
                        )
                    }
                    onClick={() => onMenuItemClick('delete')}
                    dataTest="file-menu-delete"
                />
            </HoverMenuList>
        </HoverMenuDropdown>
    )
}
