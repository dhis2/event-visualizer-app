import i18n from '@dhis2/d2-i18n'
import { Tooltip, TabBar, Tab } from '@dhis2/ui'
import { useState, type FC, type ReactNode } from 'react'
import { ConditionsTabContent } from './conditions-tab-content'
import { RepeatedEventsTabContent } from './repeated-events-tab-content'
import classes from './styles/conditions-modal-content.module.css'
import { useAppSelector, useProgramStageMetadataItem } from '@hooks'
import { getDimensionIdParts } from '@modules/dimension.js'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem /*, ValueType */ } from '@types'

const TAB_CONDITIONS = 'CONDITIONS'
const TAB_REPEATABLE_EVENTS = 'REPEATABLE_EVENTS'

type ConditionsModalContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsModalContent: FC<ConditionsModalContentProps> = ({
    dimension,
}) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const stage = useProgramStageMetadataItem(
        getDimensionIdParts({ id: dimension.id }).programStageId
    )

    const [currentTab, setCurrentTab] = useState<string>(TAB_CONDITIONS)

    const isRepeatable: boolean =
        visType === 'LINE_LIST' && dimension.dimensionType === 'DATA_ELEMENT'

    const renderTabs = (): ReactNode => {
        const disableRepeatableTab = !stage?.repeatable
        const repeatableTab = (
            <Tab
                key={TAB_REPEATABLE_EVENTS}
                onClick={() => setCurrentTab(TAB_REPEATABLE_EVENTS)}
                selected={currentTab === TAB_REPEATABLE_EVENTS}
                disabled={disableRepeatableTab}
            >
                {i18n.t('Repeated events')}
            </Tab>
        )

        return (
            <>
                <TabBar className={classes.tabBar}>
                    <Tab
                        key={TAB_CONDITIONS}
                        onClick={() => setCurrentTab(TAB_CONDITIONS)}
                        selected={currentTab === TAB_CONDITIONS}
                    >
                        {i18n.t('Conditions')}
                    </Tab>
                    {disableRepeatableTab ? (
                        <Tooltip
                            key="repeatable-tooltip"
                            placement="bottom"
                            content={i18n.t(
                                'Only available for repeatable stages'
                            )}
                            dataTest="repeatable-events-tooltip"
                        >
                            {repeatableTab}
                        </Tooltip>
                    ) : (
                        repeatableTab
                    )}
                </TabBar>
                {currentTab === TAB_CONDITIONS ? (
                    <ConditionsTabContent dimension={dimension} />
                ) : (
                    <RepeatedEventsTabContent dimensionId={dimension.id} />
                )}
            </>
        )
    }

    return isRepeatable ? (
        renderTabs()
    ) : (
        <ConditionsTabContent dimension={dimension} />
    )
}
