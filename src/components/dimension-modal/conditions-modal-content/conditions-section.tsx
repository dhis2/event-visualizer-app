import { CollapseIcon } from '@components/main-sidebar/dimension-card/collapse-icon'
import { useCallback, useState, type FC, type ReactNode } from 'react'
import classes from './styles/conditions-modal-content.module.css'

type ConditionsSectionProps = {
    title: string
    children: ReactNode
    collapsible?: boolean
    defaultExpanded?: boolean
    dataTest?: string
}

export const ConditionsSection: FC<ConditionsSectionProps> = ({
    title,
    children,
    collapsible = false,
    defaultExpanded = true,
    dataTest,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    const toggleExpanded = useCallback(() => {
        if (collapsible) {
            setIsExpanded((expanded) => !expanded)
        }
    }, [collapsible])

    const header = (
        <>
            <CollapseIcon isCollapsed={!isExpanded} />
            <span>{title}</span>
        </>
    )

    return (
        <section className={classes.section} data-test={dataTest}>
            {collapsible ? (
                <button
                    type="button"
                    className={classes.sectionHeaderButton}
                    onClick={toggleExpanded}
                    aria-expanded={isExpanded}
                    data-test={dataTest ? `${dataTest}-toggle` : undefined}
                >
                    {header}
                </button>
            ) : (
                <div className={classes.sectionHeader}>{header}</div>
            )}
            {isExpanded && (
                <div
                    className={classes.sectionBody}
                    data-test={dataTest ? `${dataTest}-content` : undefined}
                >
                    {children}
                </div>
            )}
        </section>
    )
}
