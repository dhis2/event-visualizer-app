export type FilterItem = { id: string; name?: string }

/* Set by @dhis2/analytics' InterpretationModal from interpretation.created, so
 * the visualization renders as it stood when the interpretation was written. */
type InterpretationModalFilters = {
    relativePeriodDate?: string
}

/* What a dashboard narrows an item by. `ou` and `pe` are separate named fields
 * because analytics treats them differently (`pe` conflicts with stage date
 * dimensions); `yourDimensions` is keyed by dimension uid. */
export type DashboardFilters = {
    ou?: FilterItem[]
    pe?: FilterItem[]
    yourDimensions?: Record<string, FilterItem[]>
}

export type HostFilters = InterpretationModalFilters & DashboardFilters
