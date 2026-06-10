import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import classes from './styles/sidebar-empty-state.module.css'

export const SidebarEmptyState: FC = () => (
    <div className={classes.emptyState} data-test="sidebar-empty-state">
        <svg
            className={classes.icon}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="currentColor"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M30 31H2V15H30V31ZM4 29H28V17H4V29ZM8 26H6V24H8V26ZM26 26H10V24H26V26ZM8 22H6V20H8V22ZM26 22H10V20H26V22ZM30 13H2V1H30V13ZM4 11H28V3H4V11ZM8 8H6V6H8V8ZM26 8H10V6H26V8Z" />
        </svg>
        <p className={classes.description}>
            {i18n.t(
                'Choose a data source above to see its dimensions, periods, and organisation units.'
            )}
        </p>
    </div>
)
