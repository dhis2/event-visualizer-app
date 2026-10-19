/* Why a control cannot be used, or undefined when it can. Callers decide what
 * to do with it: a tooltip to explain it, a disabled or muted appearance, or
 * both. */
export type TooltipConfig = { content: string; openDelay?: number } | undefined

/* Longer than the DHIS2 UI default, so the bottom bar's tooltips don't flicker
 * as the pointer crosses the row of controls. */
export const DEFAULT_TOOLTIP_OPEN_DELAY = 500
