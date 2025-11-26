import i18n from '@dhis2/d2-i18n'
import { useMemo, useState, type FC } from 'react'
import { OptionsModal } from '@components/options/options-modal'
import {
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { getOptionsSectionsForVisType } from '@modules/options'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { OptionsSectionKey } from 'src/types/options'

export const OptionsMenu: FC = () => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const [activeSectionKey, setActiveSectionKey] =
        useState<OptionsSectionKey | null>(null)
    const optionsSections = useMemo(
        () => getOptionsSectionsForVisType(visType),
        [visType]
    )

    return (
        <>
            <HoverMenuDropdown label={i18n.t('Options')}>
                <HoverMenuList dataTest="options-menu-list">
                    {optionsSections.map(({ key, label }) => (
                        <HoverMenuListItem
                            key={key}
                            label={label}
                            onClick={() => {
                                setActiveSectionKey(key)
                            }}
                        />
                    ))}
                </HoverMenuList>
            </HoverMenuDropdown>
            {activeSectionKey && (
                <OptionsModal
                    activeSectionKey={activeSectionKey}
                    setActiveSectionKey={setActiveSectionKey}
                    sections={optionsSections}
                    visType={visType}
                />
            )}
        </>
    )
}
