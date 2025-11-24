import type { EventStatus, EnrollmentStatus } from './dhis2-openapi-schemas'

export type Status =
    | Extract<EventStatus, 'ACTIVE' | 'COMPLETED' | 'SCHEDULE'>
    | Extract<EnrollmentStatus, 'CANCELLED'>
