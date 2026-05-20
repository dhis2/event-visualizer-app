import { useAppSelector } from '@hooks'
import { getUiDimensionDialogMode } from '@store/ui-slice'
import cx from 'classnames'
import { type FC, type ReactNode } from 'react'
import classes from './styles/section-header.module.css'

type SectionHeaderProps = {
    children: ReactNode
    icon?: ReactNode
}

export const SectionHeader: FC<SectionHeaderProps> = ({ children, icon }) => {
    const mode = useAppSelector(getUiDimensionDialogMode)
    const isModal = mode === 'modal'

    return (
        <div
            className={cx(classes.sectionHeader, {
                [classes.modal]: isModal,
            })}
        >
            {icon && <span className={classes.icon}>{icon}</span>}
            <h4 className={classes.title}>{children}</h4>
        </div>
    )
}
