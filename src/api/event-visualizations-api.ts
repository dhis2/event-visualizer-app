import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { parseCondition } from '@modules/conditions'
import { getDimensionMetadataFields } from '@modules/visualization'
import type { CurrentUser, Option, SavedVisualization } from '@types'

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

                    metadataStore.setVisualizationMetadata(visualization)

                    const optionSetsMetadata = {}

                    const dimensions = [
                        ...(visualization.columns || []),
                        ...(visualization.rows || []),
                        ...(visualization.filters || []),
                    ]

                    for (const dimension of dimensions) {
                        if (
                            dimension?.optionSet?.id &&
                            dimension.filter?.startsWith('IN')
                        ) {
                            const optionSetId = dimension.optionSet.id
                            const conditions = parseCondition(dimension.filter)

                            if (!conditions) {
                                throw new Error(
                                    `Could not parse dimension filter "${dimension.filter}"`
                                )
                            }

                            const optionsData = (await engine.query({
                                options: {
                                    resource: 'options',
                                    params: {
                                        fields: 'id,code,displayName~rename(name)',
                                        filter: [
                                            `optionSet.id:eq:${optionSetId}`,
                                            `code:in:[${conditions.join(',')}]`,
                                        ],
                                        paging: false,
                                    },
                                },
                            })) as { options?: { options: Option[] } }

                            const options = optionsData?.options?.options

                            if (optionsData?.options) {
                                // update options in the optionSet metadata used for the lookup of the correct
                                // name from code (options for different option sets have the same code)
                                optionSetsMetadata[optionSetId] = {
                                    id: optionSetId,
                                    options,
                                }
                            }
                        }
                    }
                    if (Object.keys(optionSetsMetadata).length) {
                        metadataStore.addMetadata(optionSetsMetadata)
                    }

                    // update most viewed statistics
                    await engine.mutate({
                        resource: 'dataStatistics',
                        type: 'create',
                        params: {
                            eventType: 'EVENT_VISUALIZATION_VIEW',
                            favorite: id,
                        },
                        data: {},
                    })

                    return { data: visualization }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
