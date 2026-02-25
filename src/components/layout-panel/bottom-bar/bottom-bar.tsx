import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/bottom-bar.module.css'
import { UpdateButton } from './update-button'
import { useAppSelector } from '@hooks'
import { getIsVisualizationLoading } from '@store/loader-slice'

export const BottomBar: FC = () => {
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return (
        <div className={classes.bottomBar}>
            <div
                className={cx(classes.container, {
                    [classes.loading]: isVisualizationLoading,
                })}
            >
                <UpdateButton />
            </div>
        </div>
    )
}
