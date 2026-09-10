import i18n from '@dhis2/d2-i18n'
import type { CanvasErrorDisplay } from './canvas-error-display'

/* Shown for E7121 and, from get-error-display, for an access error that names
 * no code at all: the same refusal as far as the user is concerned. */
export const restrictedDataAccess = (): CanvasErrorDisplay => ({
    icon: 'data',
    title: i18n.t('Restricted access'),
    description: i18n.t(
        "You don't have access to the data in this visualization. Contact a system administrator."
    ),
})

/* DHIS2 backend error codes and their user-facing screen. Each title names what
 * went wrong rather than reporting a generic failure, since reaching this table
 * means the code told us. Titles avoid asserting a cause the response does not
 * prove. The database icon says the data or the metadata behind it is the
 * problem, the warning triangle that the request or the system failed. */
export const getBackendErrorCodeDisplay = (
    errorCode: string
): CanvasErrorDisplay | undefined => {
    switch (errorCode) {
        /* Any metadata object that could not be found. The only metadata fetch
         * whose failure reaches the canvas is the visualization itself. */
        case 'E1005':
            return {
                icon: 'generic',
                title: i18n.t('Visualization not found'),
                description: i18n.t(
                    'The visualization you are trying to view could not be found, the ID could be incorrect or it could have been deleted.'
                ),
            }
        case 'E7121':
            return restrictedDataAccess()
        /* The user account carries a constraint on a dimension it can read no
         * items of, so this is about the account rather than the
         * visualization. */
        case 'E7123':
            return {
                icon: 'data',
                title: i18n.t('Restricted access'),
                description: i18n.t(
                    "You don't have access to any items in a dimension your user account is restricted to. Contact a system administrator."
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
                title: i18n.t('Invalid indicator'),
                description: i18n.t(
                    "There's a problem with at least one selected indicator."
                ),
            }
        /* Reported when a stage is missing from its program, which happens when
         * the metadata changed after the visualization was saved. */
        case 'E7236':
        case 'E7245':
            return {
                icon: 'data',
                title: i18n.t('Program stage not available'),
                description: i18n.t(
                    'A program stage in this visualization is no longer part of its program. It may have been changed or removed.'
                ),
            }
        /* The backend reports a dimension it cannot resolve the same way whether
         * the item was removed from the program or the app built the dimension
         * ID wrongly, so neither the title nor the copy may claim a cause. */
        case 'E7222':
        case 'E7223':
        case 'E7224':
        case 'E7226':
            return {
                icon: 'data',
                title: i18n.t('Dimension not available'),
                description: i18n.t(
                    'A dimension in this visualization is no longer valid. It may have been removed from the program.'
                ),
            }
        case 'E7142':
            return {
                icon: 'data',
                title: i18n.t('Program not available'),
                description: i18n.t(
                    'A program in this visualization is not available for the selected tracked entity type.'
                ),
            }
        case 'E7128':
            return {
                icon: 'data',
                title: i18n.t('Too much data'),
                description: i18n.t(
                    'This request returns more data than the server allows. Add a filter or choose a shorter period.'
                ),
            }
        case 'E7209':
            return {
                icon: 'generic',
                title: i18n.t('Top limit too high'),
                description: i18n.t(
                    'The top limit in this visualization is higher than the server allows. Lower it in the options.'
                ),
            }
        case 'E7131':
            return {
                icon: 'generic',
                title: i18n.t('Request timed out'),
                description: i18n.t(
                    'The request took too long and was stopped. Try again, or reduce the amount of data requested.'
                ),
                retryable: true,
            }
        case 'E7144':
            return {
                icon: 'generic',
                title: i18n.t('Analytics not generated'),
                description: i18n.t(
                    'The analytics tables have not been generated. Contact a system administrator.'
                ),
            }
        case 'E7145':
            return {
                icon: 'generic',
                title: i18n.t('Analytics request failed'),
                description: i18n.t(
                    'The server could not run this request. Contact a system administrator.'
                ),
            }
        default:
            return undefined
    }
}
