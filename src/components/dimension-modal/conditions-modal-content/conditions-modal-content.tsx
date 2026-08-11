import i18n from '@dhis2/d2-i18n'
import { Tooltip, TabBar, Tab } from '@dhis2/ui'
import { useAppSelector, useProgramStageMetadataItem } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem } from '@types'
import {
    forwardRef,
    useState,
    type FC,
    type MutableRefObject,
    type ReactNode,
} from 'react'
import { ConditionsTabContent } from './conditions-tab-content'
import { RepeatedEventsTabContent } from './repeated-events-tab-content'
import classes from './styles/conditions-modal-content.module.css'

const TAB_CONDITIONS = 'CONDITIONS'
const TAB_REPEATABLE_EVENTS = 'REPEATABLE_EVENTS'

/* TabBar injects a ref into each direct child, so we must use a component
 * that accepts a ref. The Tooltip renderProps params also expose a ref
 * that needs to be attached to the returned element. So we need to attach
 * two refs to one node. Both refs are object refs (TabBar's via createRef,
 * Tooltip's via useRef), but their declared types are wider, so we narrow
 * them to assign the span node. */
const TooltipWithForwardRef = forwardRef<
    HTMLSpanElement,
    { children: ReactNode }
>(function RepeatableEventsTabTooltip({ children }, ref) {
    const tabBarRef = ref as MutableRefObject<HTMLSpanElement | null>
    return (
        <Tooltip
            placement="bottom"
            content={i18n.t('Only available for repeatable stages')}
            dataTest="repeatable-events-tooltip"
        >
            {({ onMouseOver, onMouseOut, ref }) => {
                const tooltipRef =
                    ref as MutableRefObject<HTMLSpanElement | null>
                return (
                    <span
                        ref={(node) => {
                            tabBarRef.current = node
                            tooltipRef.current = node
                        }}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        className={classes.tooltipReference}
                    >
                        {children}
                    </span>
                )
            }}
        </Tooltip>
    )
})

type ConditionsModalContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsModalContent: FC<ConditionsModalContentProps> = ({
    dimension,
}) => {
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const stage = useProgramStageMetadataItem(dimension.programStageId)

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
                        {i18n.t('Data')}
                    </Tab>
                    {disableRepeatableTab ? (
                        <TooltipWithForwardRef key={TAB_REPEATABLE_EVENTS}>
                            {repeatableTab}
                        </TooltipWithForwardRef>
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
