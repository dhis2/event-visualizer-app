import { type FC } from 'react'
import classes from './styles/bottom-bar.module.css'
import { UpdateButton } from './update-button'

export const BottomBar: FC = () => {
    return (
        <div className={classes.bottomBar}>
            <div className={classes.bottomBarButtons}>
                <UpdateButton />
            </div>
        </div>
    )
}
