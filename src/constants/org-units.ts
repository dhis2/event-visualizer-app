export const USER_ORG_UNITS = [
    'USER_ORGUNIT',
    'USER_ORGUNIT_CHILDREN',
    'USER_ORGUNIT_GRANDCHILDREN',
] as const

export type UserOrgUnit = (typeof USER_ORG_UNITS)[number]
