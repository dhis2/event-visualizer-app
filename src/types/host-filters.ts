export type FilterItem = { id: string; name?: string }

/* Set by @dhis2/analytics' InterpretationModal from interpretation.created, so
 * the visualization renders as it stood when the interpretation was written. */
type InterpretationModalFilters = {
    relativePeriodDate?: string
}

/* What a dashboard narrows an item by. `ou` and `pe` are named because they
 * behave differently against event analytics: `ou` always applies, while `pe`
 * conflicts with stage-specific date dimensions. `yourDimensions` is keyed by
 * dimension uid as listed by /api/dimensions, and never holds `ou` or `pe`. */
type DashboardFilters = {
    ou?: FilterItem[]
    pe?: FilterItem[]
    yourDimensions?: Record<string, FilterItem[]>
}

export type HostFilters = InterpretationModalFilters & DashboardFilters
