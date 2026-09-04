export type PluginFilters = {
    /* The only filter this app applies; set by @dhis2/analytics'
     * InterpretationModal from interpretation.created. */
    relativePeriodDate?: string
    /* Dashboard filters — not applied; their presence just triggers the
     * "not applied" notice, so their values are opaque to us. */
    [dimension: string]: unknown
}
