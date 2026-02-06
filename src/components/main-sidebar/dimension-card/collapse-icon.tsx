import type { FC } from 'react'
import classes from './styles/collapse-icon.module.css'

const ChevronDown = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3.37575 4.75194C3.18135 4.41861 3.42175 4 3.80765 4L8.19163 4C8.57753 4 8.81796 4.41861 8.62352 4.75194L6.43154 8.5096C6.2386 8.8404 5.7607 8.8404 5.56776 8.5096L3.37575 4.75194Z"
            fill="currentColor"
        />
    </svg>
)

const ChevronRight = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M5.00194 8.62401C4.66861 8.81841 4.25 8.57801 4.25 8.19211V3.80813C4.25 3.42223 4.66861 3.1818 5.00194 3.37624L8.7596 5.56822C9.0904 5.76116 9.0904 6.23906 8.7596 6.432L5.00194 8.62401Z"
            fill="currentColor"
        />
    </svg>
)

export const CollapseIcon: FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => (
    <div className={classes.container} data-test="dimension-card-collapse-item">
        {isCollapsed ? <ChevronRight /> : <ChevronDown />}
    </div>
)
