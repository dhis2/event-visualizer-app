import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { listenerMiddleware } from './middleware/listener'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import { api } from '@api/api'
import { getDimensionMetadataFields } from '@modules/visualization'
import { SavedVisualization } from '@types'

export interface NavigationState {
    visualizationId: string | 'new'
    interpretationId: string | null
}

export const initialState: NavigationState = {
    visualizationId: 'new',
    interpretationId: null,
}

export const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setNavigationState: (
            state,
            action: PayloadAction<{
                visualizationId: string | 'new'
                interpretationId?: string | null
            }>
        ) => {
            state.visualizationId = action.payload.visualizationId
            state.interpretationId = action.payload.interpretationId ?? null
        },
    },
})

export const { setNavigationState } = navigationSlice.actions

listenerMiddleware.startListening({
    actionCreator: setNavigationState,
    effect: async (action, listenerApi) => {
        console.log(
            `navigation state changed: visualizationId: ${action.payload.visualizationId} interpretationId: ${action.payload.interpretationId}`
        )
        console.log('state:', listenerApi.getState())

        const dispatch = listenerApi.dispatch

        if (action.payload.visualizationId === 'new') {
            dispatch(clearSavedVis())
            dispatch(clearCurrentVis())
        } else {
            try {
                const nameProp = 'name' // TODO this should come from user settings
                const dimensionFields =
                    'dimension,dimensionType,filter,program[id],programStage[id],optionSet[id],valueType,legendSet[id],repetition,items[dimensionItem~rename(id)]'

                const eventVisualizationResult = await dispatch(
                    api.endpoints.query.initiate({
                        resource: 'eventVisualizations',
                        id: action.payload.visualizationId,
                        params: {
                            fields: [
                                '*',
                                `columns[${dimensionFields}]`,
                                `rows[${dimensionFields}]`,
                                `filters[${dimensionFields}]`,
                                `program[id,programType,${nameProp}~rename(name),displayEnrollmentDateLabel,displayIncidentDateLabel,displayIncidentDate,programStages[id,displayName~rename(name),repeatable]]`,
                                'programStage[id,displayName~rename(name),displayExecutionDateLabel,displayDueDateLabel,hideDueDate,repeatable]',
                                `programDimensions[id,${nameProp}~rename(name),enrollmentDateLabel,incidentDateLabel,programType,displayIncidentDate,displayEnrollmentDateLabel,displayIncidentDateLabel,programStages[id,${nameProp}~rename(name),repeatable,hideDueDate,displayExecutionDateLabel,displayDueDateLabel]]`,
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
                            ],
                        },
                    })
                )

                // TODO use the custom endpoint
                //const visualizationData = await dispatch(api.endpoints.getVisualization.initiate(action.payload.visualizationId))

                console.log('fetch result', eventVisualizationResult)
                dispatch(
                    setSavedVis(
                        eventVisualizationResult.data as SavedVisualization
                    )
                )

                dispatch(
                    setCurrentVis(
                        eventVisualizationResult.data as SavedVisualization
                    )
                )
            } catch (err) {
                console.log('getEventVisualization error', err)
            }
        }
    },
})
