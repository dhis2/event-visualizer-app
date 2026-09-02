import i18n from '@dhis2/d2-i18n'
import type { CanvasErrorIcon } from './icons'

type ErrorCodeDisplay = {
    icon: CanvasErrorIcon
    title: string
    description: string
}

/* DHIS2 analytics backend error codes and their user-facing message. All are
 * deterministic server rejections (restricted access, bad request), so they
 * render without a Retry. */
export const getBackendErrorCodeDisplay = (
    errorCode: string
): ErrorCodeDisplay | undefined => {
    switch (errorCode) {
        case 'E7121':
        case 'E7123':
            return {
                icon: 'data',
                title: i18n.t('Restricted access'),
                description: i18n.t(
                    "You don't have access to the data in this visualization. Contact a system administrator."
                ),
            }
        case 'E7120':
            return {
                icon: 'data',
                title: i18n.t('Restricted access'),
                description: i18n.t(
                    "You don't have access to one or more of the chosen organisation units."
                ),
            }
        case 'E7217':
            return {
                icon: 'data',
                title: i18n.t('Restricted access'),
                description: i18n.t(
                    "You don't have access to event analytics. Contact a system administrator."
                ),
            }
        case 'E7132':
            return {
                icon: 'data',
                title: i18n.t('Something went wrong'),
                description: i18n.t(
                    "There's a problem with at least one selected indicator."
                ),
            }
        case 'E7144':
            return {
                icon: 'generic',
                title: i18n.t('Something went wrong'),
                description: i18n.t(
                    "There's a problem with the generated analytics. Contact a system administrator."
                ),
            }
        case 'E7145':
            return {
                icon: 'generic',
                title: i18n.t('Something went wrong'),
                description: i18n.t(
                    "There's a syntax problem with the analytics request."
                ),
            }
        default:
            return undefined
    }
}
