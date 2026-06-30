export const AXES_HEIGHT_STORAGE_KEY = 'dhis2.event-visualizer.axesHeight'

/* Sentinel for "no user-set height": the panel fits its content. Stored in the
 * UI slice alongside numeric user-set heights, so the height is
 * `number | typeof LAYOUT_PANEL_HEIGHT_AUTO_FIT`. A named sentinel reads more
 * clearly at call sites than a bare `null`. */
export const LAYOUT_PANEL_HEIGHT_AUTO_FIT = 'AUTO_FIT'

export type LayoutPanelHeight = number | typeof LAYOUT_PANEL_HEIGHT_AUTO_FIT
