import { useAppSelector } from '@hooks'
import { getUiLayoutPanelVisible } from '@store/ui-slice'
import { type FC } from 'react'
import { Axes } from './axes'
import classes from './styles/layout-panel.module.css'
import { TopBar } from './top-bar/top-bar'

export const LayoutPanel: FC = () => {
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)

    return isLayoutPanelVisible ? (
        <div className={classes.panel}>
            <TopBar />
            <Axes />
        </div>
    ) : null
}
