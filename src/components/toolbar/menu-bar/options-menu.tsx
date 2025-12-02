import i18n from '@dhis2/d2-i18n'
import { useMemo, useState, type FC } from 'react'
import { OptionsModal } from '@components/options/options-modal'
import {
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import { getOptionsTabsForVisType } from '@modules/options'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { OptionsTabKey } from 'src/types/options'

export const OptionsMenu: FC = () => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const [activeTabKey, setActiveTabKey] = useState<OptionsTabKey | null>(null)
    const optionsTabs = useMemo(
        () => getOptionsTabsForVisType(visType),
        [visType]
    )

    return (
        <>
            <HoverMenuDropdown label={i18n.t('Options')}>
                <HoverMenuList dataTest="options-menu-list">
                    {optionsTabs.map(({ key, label }) => (
                        <HoverMenuListItem
                            key={key}
                            label={label}
                            onClick={() => {
                                setActiveTabKey(key)
                            }}
                        />
                    ))}
                </HoverMenuList>
            </HoverMenuDropdown>
            {activeTabKey && (
                <OptionsModal
                    activeTabKey={activeTabKey}
                    setActiveTabKey={setActiveTabKey}
                    tabs={optionsTabs}
                    visType={visType}
                />
            )}
        </>
    )
}
