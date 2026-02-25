import cx from 'classnames'
import { type FC } from 'react'
import classes from './styles/bottom-bar.module.css'
import { UpdateButton } from './update-button'
import { useAppSelector } from '@hooks'
import { getDataSourceId } from '@store/dimensions-selection-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'

export const BottomBar: FC = () => {
    const dataSourceId = useAppSelector(getDataSourceId)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return (
        <div className={classes.bottomBar}>
            <div
                className={cx(classes.container, {
                    [classes.loading]: isVisualizationLoading,
                    [classes.empty]: !dataSourceId,
                })}
            >
                <UpdateButton />
            </div>
        </div>
    )
}
