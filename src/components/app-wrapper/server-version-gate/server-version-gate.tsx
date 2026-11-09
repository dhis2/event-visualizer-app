import { IconErrorGeneric } from '@assets/icon-error-generic'
import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import type { FC, ReactNode } from 'react'
import classes from './styles/server-version-gate.module.css'

type ServerVersion = NonNullable<ReturnType<typeof useConfig>['serverVersion']>

/* The app is bundled with DHIS2 2.43.3 and depends on backend fixes from that
 * release. The App Hub only checks major versions, so it can be installed on
 * 2.43.0-2.43.2 too. */
const MIN_MINOR = 43
const MIN_PATCH = 3

const isUnsupported = ({ major, minor, patch }: ServerVersion) =>
    major === 2 &&
    minor !== undefined &&
    (minor < MIN_MINOR || (minor === MIN_MINOR && (patch ?? 0) < MIN_PATCH))

export const ServerVersionGate: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { serverVersion } = useConfig()

    if (!serverVersion || !isUnsupported(serverVersion)) {
        return children
    }

    return (
        <div className={classes.outer}>
            <div className={classes.inner} data-test="server-version-gate">
                <div className={classes.icon}>
                    <IconErrorGeneric />
                </div>
                <p className={classes.title}>
                    {i18n.t('App not supported on DHIS2 Core {{version}}', {
                        version: serverVersion.full,
                    })}
                </p>
                <p className={classes.description}>
                    {i18n.t(
                        'Please ask your system administrator to upgrade to {{version}} to use the Individual Data Visualizer app.',
                        { version: `2.${MIN_MINOR}.${MIN_PATCH}` }
                    )}
                </p>
            </div>
        </div>
    )
}
