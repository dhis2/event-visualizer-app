import { useProgramMetadataItem } from '@components/app-wrapper/metadata-provider/metadata-provider'
import i18n from '@dhis2/d2-i18n'
import { useLayoutContext, useMetadataItem } from '@hooks'
import { isDataSourceProgramWithRegistration } from '@modules/data-source'
import type { OutputType } from '@types'

/* The noun an output type's records are called, as configured on the program
 * (or the tracked entity type's own name), falling back to a generic term. */
export const useOutputTypeLabel = (outputType: OutputType): string => {
    const { programIds, tetId } = useLayoutContext()
    const programMetadata = useProgramMetadataItem(programIds[0])
    const tetMetadata = useMetadataItem(tetId)

    switch (outputType) {
        case 'EVENT':
            return isDataSourceProgramWithRegistration(programMetadata) &&
                programMetadata.displayEventLabel
                ? programMetadata.displayEventLabel
                : i18n.t('Event')
        case 'ENROLLMENT':
            return isDataSourceProgramWithRegistration(programMetadata) &&
                programMetadata.displayEnrollmentLabel
                ? programMetadata.displayEnrollmentLabel
                : i18n.t('Enrollment')
        case 'TRACKED_ENTITY_INSTANCE':
            return tetMetadata?.name ?? i18n.t('tracked entity')
    }
}
