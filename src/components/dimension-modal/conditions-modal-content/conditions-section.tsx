import { IconChevronDown16, IconChevronUp16 } from '@dhis2/ui'
import { useCallback, useState, type FC, type ReactNode } from 'react'
import classes from './styles/conditions-modal-content.module.css'

type ConditionsSectionProps = {
    title: string
    titleIcon?: ReactNode
    children: ReactNode
    collapsible?: boolean
    defaultExpanded?: boolean
    dataTest?: string
}

export const ConditionsSection: FC<ConditionsSectionProps> = ({
    title,
    titleIcon,
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
            <span className={classes.sectionHeaderLabelRow}>
                {titleIcon ? (
                    <span className={classes.sectionHeaderIcon} aria-hidden>
                        {titleIcon}
                    </span>
                ) : null}
                <span className={classes.sectionHeaderTitle}>{title}</span>
            </span>
            {collapsible && (
                <span className={classes.sectionHeaderChevron} aria-hidden>
                    {isExpanded ? <IconChevronUp16 /> : <IconChevronDown16 />}
                </span>
            )}
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
