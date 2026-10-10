import { type TooltipConfig } from '@components/layout-panel/bottom-bar/with-tooltip'
import i18n from '@dhis2/d2-i18n'

/* Why the layout's program count is unusable, for the parts of the bottom bar
 * that can only describe a single-program layout. Mirrors the tooltips the
 * output type buttons show for the same layouts. */
export const getProgramCountTooltipConfig = (
    programIds: string[]
): TooltipConfig => {
    if (programIds.length === 0) {
        return { content: i18n.t('Not valid without a program') }
    }
    if (programIds.length > 1) {
        return { content: i18n.t('Not valid with multiple programs') }
    }
    return undefined
}
