import i18n from '@dhis2/d2-i18n'
import type { Status } from '@types'

export const getStatusNames = (): Record<Status, string> => ({
    ACTIVE: i18n.t('Active'),
    CANCELLED: i18n.t('Cancelled'),
    COMPLETED: i18n.t('Completed'),
    SCHEDULE: i18n.t('Scheduled'),
})
