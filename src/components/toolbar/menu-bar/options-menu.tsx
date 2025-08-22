import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import {
    //    VisualizationOptions,
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
//import { getOptionsByType } from '../../modules/options/config.js'
//import UpdateVisualizationContainer from '../UpdateButton/UpdateVisualizationContainer.js'

export const OptionsMenu: FC = () => {
    return (
        <HoverMenuDropdown label={i18n.t('Options')}>
            <HoverMenuList dataTest="options-menu-list">
                <HoverMenuListItem label="TBD" />
            </HoverMenuList>
        </HoverMenuDropdown>
    )
    //    const [selectedOptionConfigKey, setSelectedOptionConfigKey] = useState(null)
    //
    //    const onOptionsUpdate = (handler) => {
    //        handler()
    //        setSelectedOptionConfigKey(null)
    //    }
    //
    //    const optionsConfig = getOptionsByType()
    //
    //    return (
    //        <>
    //            <HoverMenuDropdown label={i18n.t('Options')}>
    //                <HoverMenuList dataTest="options-menu-list">
    //                    {optionsConfig.map(({ label, key }) => (
    //                        <HoverMenuListItem
    //                            key={key}
    //                            label={label}
    //                            onClick={() => {
    //                                setSelectedOptionConfigKey(key)
    //                            }}
    //                        />
    //                    ))}
    //                </HoverMenuList>
    //            </HoverMenuDropdown>
    //            {selectedOptionConfigKey && (
    //                <UpdateVisualizationContainer
    //                    renderComponent={(handler) => (
    //                        <VisualizationOptions
    //                            optionsConfig={optionsConfig}
    //                            onUpdate={() => onOptionsUpdate(handler)}
    //                            onClose={() => setSelectedOptionConfigKey(null)}
    //                            initiallyActiveTabKey={selectedOptionConfigKey}
    //                        />
    //                    )}
    //                />
    //            )}
    //        </>
    //    )
}
