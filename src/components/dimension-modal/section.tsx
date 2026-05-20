import { useAppSelector } from '@hooks'
import { getUiDimensionDialogMode } from '@store/ui-slice'
import cx from 'classnames'
import { type FC, type ReactNode } from 'react'
import { SectionHeader } from './section-header'
import classes from './styles/section.module.css'

type SectionProps = {
    icon?: ReactNode
    title: ReactNode
    children: ReactNode
    topBorder?: boolean
}

export const Section: FC<SectionProps> = ({
    icon,
    title,
    children,
    topBorder,
}) => {
    const mode = useAppSelector(getUiDimensionDialogMode)
    const isModal = mode === 'modal'

    return (
        <section
            className={cx(classes.section, {
                [classes.modal]: isModal,
                [classes.topBorder]: topBorder && isModal,
            })}
        >
            <SectionHeader icon={icon}>{title}</SectionHeader>
            <div className={classes.content}>{children}</div>
        </section>
    )
}
