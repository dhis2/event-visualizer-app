export type OuIdHelper = {
    addLevelPrefix: (id: string) => string
    addGroupPrefix: (id: string) => string
    removePrefix: (id: string) => string
    hasGroupPrefix: (id: string) => string
    hasLevelPrefix: (id: string) => string
}
