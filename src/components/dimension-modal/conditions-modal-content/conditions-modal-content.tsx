import i18n from '@dhis2/d2-i18n'
import { Tooltip, TabBar, Tab } from '@dhis2/ui'
import { useAppSelector, useProgramStageMetadataItem } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem } from '@types'
import { forwardRef, useState, type FC, type ReactNode, type Ref } from 'react'
import { ConditionsTabContent } from './conditions-tab-content'
import { RepeatedEventsTabContent } from './repeated-events-tab-content'
import classes from './styles/conditions-modal-content.module.css'

const TAB_CONDITIONS = 'CONDITIONS'
const TAB_REPEATABLE_EVENTS = 'REPEATABLE_EVENTS'

const assignRef = <T,>(ref: Ref<T>, node: T | null): void => {
    if (typeof ref === 'function') {
        ref(node)
    } else if (ref) {
        ;(ref as { current: T | null }).current = node
    }
}

/*
 * TabBar injects a ref into each direct child and calls .focus() on it for
 * keyboard navigation, so a child must resolve to a DOM node. Tooltip is not a
 * forwardRef component, so it can't be that child directly. This wrapper is the
 * direct child instead: it forwards TabBar's ref onto the same <span> the
 * tooltip anchors to, and that span (not the disabled tab) receives the hover
 * that opens the tooltip.
 */
const RepeatableEventsTabTooltip = forwardRef<
    HTMLSpanElement,
    { children: ReactNode }
>(function RepeatableEventsTabTooltip({ children }, tabBarRef) {
    return (
        <Tooltip
            placement="bottom"
            content={i18n.t('Only available for repeatable stages')}
            dataTest="repeatable-events-tooltip"
        >
            {({ onMouseOver, onMouseOut, ref: tooltipRef }) => (
                <span
                    ref={(node) => {
                        assignRef(tabBarRef, node)
                        assignRef(tooltipRef, node)
                    }}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    className={classes.tooltipReference}
                >
                    {children}
                </span>
            )}
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
                        <RepeatableEventsTabTooltip key={TAB_REPEATABLE_EVENTS}>
                            {repeatableTab}
                        </RepeatableEventsTabTooltip>
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
