import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { getDimensionMetadataFields } from '@modules/visualization'
import type { CurrentUser, SavedVisualization } from '@types'

const dimensionFields: string =
    'dimension,dimensionType,filter,program[id],programStage[id],optionSet[id],valueType,legendSet[id],repetition,items[dimensionItem~rename(id)]'

export const getVisualizationQueryFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string[] => [
    '*',
    `columns[${dimensionFields}]`,
    `rows[${dimensionFields}]`,
    `filters[${dimensionFields}]`,
    `program[id,programType,${displayNameProp}~rename(name),displayEnrollmentDateLabel,displayIncidentDateLabel,displayIncidentDate,programStages[id,displayName~rename(name),repeatable]]`,
    'programStage[id,displayName~rename(name),displayExecutionDateLabel,displayDueDateLabel,hideDueDate,repeatable]',
    `programDimensions[id,${displayNameProp}~rename(name),enrollmentDateLabel,incidentDateLabel,programType,displayIncidentDate,displayEnrollmentDateLabel,displayIncidentDateLabel,programStages[id,${displayNameProp}~rename(name),repeatable,hideDueDate,displayExecutionDateLabel,displayDueDateLabel]]`,
    'access',
    'href',
    ...getDimensionMetadataFields(),
    'dataElementDimensions[legendSet[id,name],dataElement[id,name]]',
    'legend[set[id,displayName],strategy,style,showKey]',
    'trackedEntityType[id,displayName~rename(name)]',
    '!interpretations',
    '!userGroupAccesses',
    '!publicAccess',
    '!displayDescription',
    '!rewindRelativePeriods',
    '!userOrganisationUnit',
    '!userOrganisationUnitChildren',
    '!userOrganisationUnitGrandChildren',
    '!externalAccess',
    '!relativePeriods',
    '!columnDimensions',
    '!rowDimensions',
    '!filterDimensions',
    '!organisationUnitGroups',
    '!itemOrganisationUnitGroups',
    '!indicators',
    '!dataElements',
    '!dataElementOperands',
    '!dataElementGroups',
    '!dataSets',
    '!periods',
    '!organisationUnitLevels',
    '!organisationUnits',
    '!user',
]

export const eventVisualizationsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getVisualization: builder.query<SavedVisualization, string>({
            async queryFn(id, apiArg: BaseQueryApiWithExtraArg) {
                const { appCachedData, engine, metadataStore } = apiArg.extra

                try {
                    const data = await engine.query({
                        eventVisualization: {
                            resource: 'eventVisualizations',
                            id,
                            params: {
                                fields: getVisualizationQueryFields(
                                    appCachedData.currentUser.settings
                                        .displayNameProperty
                                ),
                            },
                        },
                    })

                    const visualization =
                        data.eventVisualization as SavedVisualization

                    metadataStore.addMetadata(visualization.metaData)

                    return { data: visualization }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
