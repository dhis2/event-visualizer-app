import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { preparePayloadForSave } from '@dhis2/analytics'
import { parseCondition } from '@modules/conditions'
import {
    getDimensionMetadataFields,
    getSaveableVisualization,
} from '@modules/visualization'
import type {
    CurrentUser,
    Option,
    SavedVisualization,
    MutationResult,
    RootState,
    VisualizationNameDescription,
    CurrentVisualization,
    DataEngine,
} from '@types'

const getDimensionFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string =>
    `dimension,dimensionType,filter,program[id],programStage[id],optionSet[id],valueType,legendSet[id,${displayNameProp}~rename(name)],repetition,items[dimensionItem~rename(id)]`

export const getVisualizationQueryFields = (
    displayNameProp: CurrentUser['settings']['displayNameProperty']
): string[] => [
    '*',
    `columns[${getDimensionFields(displayNameProp)}]`,
    `rows[${getDimensionFields(displayNameProp)}]`,
    `filters[${getDimensionFields(displayNameProp)}]`,
    `program[id,programType,${displayNameProp}~rename(name),displayEnrollmentDateLabel,displayIncidentDateLabel,displayIncidentDate,programStages[id,displayName~rename(name),repeatable]]`,
    'programStage[id,displayName~rename(name),displayExecutionDateLabel,displayDueDateLabel,hideDueDate,repeatable]',
    `programDimensions[id,${displayNameProp}~rename(name),enrollmentDateLabel,incidentDateLabel,programType,displayIncidentDate,displayEnrollmentDateLabel,displayIncidentDateLabel,programStages[id,${displayNameProp}~rename(name),repeatable,hideDueDate,displayExecutionDateLabel,displayDueDateLabel]]`,
    'access',
    'href',
    ...getDimensionMetadataFields(),
    'dataElementDimensions[legendSet[id,name]]',
    'legend[set[id,displayName],strategy,style,showKey]',
    `trackedEntityType[id,${displayNameProp}~rename(name)]`,
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

const fetchEventVisualization = async (
    engine: DataEngine,
    id: string,
    displayNameProperty: CurrentUser['settings']['displayNameProperty']
): Promise<SavedVisualization> => {
    const data = await engine.query({
        eventVisualization: {
            resource: 'eventVisualizations',
            id,
            params: {
                fields: getVisualizationQueryFields(displayNameProperty),
            },
        },
    })

    return data.eventVisualization as SavedVisualization
}

export const eventVisualizationsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getVisualization: builder.query<SavedVisualization, string>({
            async queryFn(id, apiArg: BaseQueryApiWithExtraArg) {
                const { appCachedData, engine, metadataStore } = apiArg.extra

                const displayNameProperty =
                    appCachedData.currentUser.settings.displayNameProperty

                try {
                    const visualization = await fetchEventVisualization(
                        engine,
                        id,
                        displayNameProperty
                    )

                    metadataStore.setVisualizationMetadata(visualization)

                    const optionSetsMetadata = {}
                    const legendSetsMetadata = {}

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
                                        fields: `id,code,${displayNameProperty}~rename(name)`,
                                        filter: [
                                            `optionSet.id:eq:${optionSetId}`,
                                            `code:in:[${conditions.join(',')}]`,
                                        ],
                                        paging: false,
                                    },
                                },
                            })) as { options?: { options: Option[] } }

                            const options = optionsData?.options?.options

                            if (Array.isArray(options)) {
                                // update options in the optionSet metadata used for the lookup of the correct
                                // name from code (options for different option sets have the same code)
                                optionSetsMetadata[optionSetId] = {
                                    id: optionSetId,
                                    options,
                                }
                            }
                        }

                        // This is to ensure that we have the required metadata to display the selected legendSet and legends in the conditions modal
                        // (NumericCondition component)
                        if (dimension.legendSet?.id) {
                            const legendSetId = dimension.legendSet.id

                            legendSetsMetadata[legendSetId] =
                                dimension.legendSet

                            if (dimension.filter?.startsWith('IN')) {
                                const conditions = parseCondition(
                                    dimension.filter
                                )

                                if (!conditions) {
                                    throw new Error(
                                        `Could not parse dimension filter "${dimension.filter}"`
                                    )
                                }

                                const legendsData = (await engine.query({
                                    legends: {
                                        resource: `legendSets/${legendSetId}/legends/gist`,
                                        params: {
                                            fields: `id,${displayNameProperty}~rename(name)`,
                                            filter: `id:in:[${conditions.join(
                                                ','
                                            )}]`,
                                            headless: true,
                                            pageSize: 1000,
                                        },
                                    },
                                })) as {
                                    legends?: { id: string; name: string }[]
                                }

                                const legends = legendsData?.legends

                                if (Array.isArray(legends)) {
                                    metadataStore.addMetadata(legends)
                                }
                            }
                        }
                    }

                    if (Object.keys(optionSetsMetadata).length) {
                        metadataStore.addMetadata(optionSetsMetadata)
                    }

                    if (Object.keys(legendSetsMetadata).length) {
                        metadataStore.addMetadata(legendSetsMetadata)
                    }

                    return { data: visualization }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),

        createVisualization: builder.mutation<string, CurrentVisualization>({
            async queryFn(currentVis, apiArg: BaseQueryApiWithExtraArg) {
                const { engine } = apiArg.extra

                try {
                    const createVisualizationResult = (await engine.mutate({
                        resource: 'eventVisualizations',
                        type: 'create',
                        data: currentVis,
                        params: {
                            skipTranslations: true,
                            skipSharing: true,
                        },
                    })) as MutationResult

                    const uid = createVisualizationResult?.response?.uid

                    if (typeof uid !== 'string') {
                        throw new Error('Missing uid in create response')
                    }

                    return { data: uid }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),

        renameVisualization: builder.mutation<
            VisualizationNameDescription,
            VisualizationNameDescription
        >({
            async queryFn(args, apiArg: BaseQueryApiWithExtraArg) {
                const { appCachedData, engine } = apiArg.extra
                const state = apiArg.getState() as RootState

                try {
                    // Get a fresh copy of the visualization, so nothing but name/description is changed
                    // This is needed because a partial update (PATCH) is not supported on the api
                    const visualization = await fetchEventVisualization(
                        engine,
                        state.savedVis.id,
                        appCachedData.currentUser.settings.displayNameProperty
                    )

                    const updateVisualizationResult = (await engine.mutate({
                        resource: 'eventVisualizations',
                        type: 'update',
                        id: visualization.id,
                        data: {
                            // prepare the visualization payload with the new name/description
                            ...preparePayloadForSave({
                                visualization: getSaveableVisualization(
                                    visualization
                                ) as SavedVisualization,
                                name: args.name,
                                description: args.description,
                            }),
                        },
                        params: {
                            skipTranslations: true,
                            skipSharing: true,
                        },
                    })) as MutationResult

                    // TODO: read mutationData.httpStatusCode instead and throw if not 200?!
                    const uid = updateVisualizationResult?.response?.uid

                    if (typeof uid !== 'string') {
                        throw new Error('Missing uid in update response')
                    }

                    // fetch the visualization name,displayName,description,displayDescription
                    const fetchNameDescriptionResult = await engine.query({
                        eventVisualization: {
                            resource: 'eventVisualizations',
                            id: visualization.id,
                            params: {
                                fields: 'name,displayName,description,displayDescription',
                            },
                        },
                    })

                    return {
                        data: fetchNameDescriptionResult.eventVisualization as VisualizationNameDescription,
                    }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),

        updateVisualization: builder.mutation<string, SavedVisualization>({
            async queryFn(visualization, apiArg: BaseQueryApiWithExtraArg) {
                const { engine } = apiArg.extra

                try {
                    if (!visualization.id) {
                        throw new Error('Missing id in updateVisualization')
                    }

                    const fetchSubscribersResult = await engine.query({
                        eventVisualization: {
                            resource: 'eventVisualizations',
                            id: visualization.id,
                            params: {
                                fields: 'subscribers',
                            },
                        },
                    })

                    const { subscribers } =
                        fetchSubscribersResult.eventVisualization as {
                            subscribers: SavedVisualization['subscribers']
                        }

                    const updateVisualizationResult = (await engine.mutate({
                        resource: 'eventVisualizations',
                        type: 'update',
                        id: visualization.id,
                        data: {
                            ...visualization,
                            subscribers,
                        },
                        params: {
                            skipTranslations: true,
                            skipSharing: true,
                        },
                    })) as MutationResult

                    const uid = updateVisualizationResult?.response?.uid

                    if (typeof uid !== 'string') {
                        throw new Error('Missing uid in update response')
                    }

                    return { data: uid }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
