import { CircularLoader } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/fetch-overlay.module.css'

export type ClientBox = {
    left: number
    top: number
    width: number
    height: number
}

export const FetchOverlay: FC<{ clientBox: ClientBox }> = ({ clientBox }) => (
    <div
        className={classes.overlay}
        style={{
            left: clientBox.left,
            top: clientBox.top,
            width: clientBox.width,
            height: clientBox.height,
        }}
        data-test="fetch-overlay"
    >
        <CircularLoader />
    </div>
)
