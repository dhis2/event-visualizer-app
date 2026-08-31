import i18n from '@dhis2/d2-i18n'
import { TabBar, Tab } from '@dhis2/ui'
import { useAppSelector, useProgramStageMetadataItem } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem } from '@types'
import { useState, type FC } from 'react'
import { ConditionsTabContent } from './conditions-tab-content'
import { RepeatedEventsTabContent } from './repeated-events-tab-content'
import classes from './styles/conditions-modal-content.module.css'

const TAB_CONDITIONS = 'CONDITIONS'
const TAB_REPEATABLE_EVENTS = 'REPEATABLE_EVENTS'

type ConditionsModalContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsModalContent: FC<ConditionsModalContentProps> = ({
    dimension,
}) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const stage = useProgramStageMetadataItem(dimension.programStageId)

    const [currentTab, setCurrentTab] = useState<string>(TAB_CONDITIONS)

    const showRepeatedEventsTab: boolean =
        visType === 'LINE_LIST' &&
        dimension.dimensionType === 'DATA_ELEMENT' &&
        Boolean(stage?.repeatable)

    return showRepeatedEventsTab ? (
        <>
            <TabBar className={classes.tabBar}>
                <Tab
                    key={TAB_CONDITIONS}
                    onClick={() => setCurrentTab(TAB_CONDITIONS)}
                    selected={currentTab === TAB_CONDITIONS}
                >
                    {i18n.t('Data')}
                </Tab>
                <Tab
                    key={TAB_REPEATABLE_EVENTS}
                    onClick={() => setCurrentTab(TAB_REPEATABLE_EVENTS)}
                    selected={currentTab === TAB_REPEATABLE_EVENTS}
                >
                    {i18n.t('Repeated events')}
                </Tab>
            </TabBar>
            {currentTab === TAB_CONDITIONS ? (
                <ConditionsTabContent dimension={dimension} />
            ) : (
                <RepeatedEventsTabContent dimensionId={dimension.id} />
            )}
        </>
    ) : (
        <ConditionsTabContent dimension={dimension} />
    )
}
