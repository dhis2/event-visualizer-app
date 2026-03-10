import { type FC } from 'react'
import { Axes } from './axes'
import { BottomBar } from './bottom-bar/bottom-bar'
import classes from './styles/layout-panel.module.css'
import { TopBar } from './top-bar/top-bar'
import { useAppSelector } from '@hooks'
import { getUiLayoutPanelVisible } from '@store/ui-slice'

export const LayoutPanel: FC = () => {
    const isLayoutPanelVisible = useAppSelector(getUiLayoutPanelVisible)

    return isLayoutPanelVisible ? (
        <div className={classes.panel}>
            <TopBar />
            <Axes />
            <BottomBar />
        </div>
    ) : null
}
