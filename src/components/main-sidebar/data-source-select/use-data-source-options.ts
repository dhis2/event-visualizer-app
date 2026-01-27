import { useCallback, useMemo, useState } from 'react'
import { useCurrentUser, useRtkQuery } from '@hooks'
import type {
    PickWithFieldFilters,
    Program,
    TrackedEntityType,
    UseRtkQueryResult,
} from '@types'

const programFields = [
    'id',
    'displayName~rename(name)',
    'enrollmentDateLabel',
    'incidentDateLabel',
    'programType',
    'programStages[id,displayName~rename(name),displayExecutionDateLabel,hideDueDate,displayDueDateLabel,repeatable]',
    'displayIncidentDate',
    'displayIncidentDateLabel',
    'displayEnrollmentDateLabel',
] as const

const trackedEntityTypeFields = ['id', 'displayName~rename(name)'] as const
const sharedParams = { filter: 'access.data.read:eq:true', paging: false }

type ProgramData = Omit<
    PickWithFieldFilters<Program, typeof programFields>,
    'id' | 'name' | 'displayName' | 'displayShortName'
> & {
    id: string
    name: string
}
type TrackedEntityTypeData = Omit<
    PickWithFieldFilters<TrackedEntityType, typeof trackedEntityTypeFields>,
    'id' | 'name' | 'displayName' | 'displayShortName'
> & {
    id: string
    name: string
}
type ResponseData = {
    programs: {
        programs: ProgramData[]
    }
    trackedEntityTypes: {
        trackedEntityTypes: TrackedEntityTypeData[]
    }
}
type OnFilterStringChangePayload = {
    value: string | undefined
}
type UseDataSourceOptionsResult = Pick<
    UseRtkQueryResult<ResponseData>,
    'isLoading' | 'isError' | 'error'
> & {
    programs: ProgramData[]
    trackedEntityTypes: TrackedEntityTypeData[]
    filterString: string
    hasMorePrograms: boolean
    hasMoreTrackedEntityTypes: boolean
    onFilterStringChange: (payload: OnFilterStringChangePayload) => void
    onShowMoreProgramsClick: () => void
    onShowMoreTrackedEntityTypesClick: () => void
}

const LIST_LENGTH_INCREMENTER = 2

function filterByNameWithMaxLength<T extends { name: string }>(
    filterString: string,
    visibleListLength: number,
    list?: Array<T>
): [T[], boolean] {
    if (!list) {
        return [[], false]
    }
    const lowerCasedFilterString = filterString.toLocaleLowerCase()
    const filteredList = list.filter((item) =>
        item?.name?.toLocaleLowerCase().includes(lowerCasedFilterString)
    )
    const slicedList = filteredList.slice(
        0,
        Math.min(visibleListLength, filteredList.length)
    )
    const hasMore = filteredList.length > slicedList.length
    return [slicedList, hasMore]
}
const replaceDisplayNameProperty = (
    fields: ReadonlyArray<string>,
    displayNameProperty: string
) =>
    fields
        .join(',')
        .replaceAll(
            'displayName~rename(name)',
            `${displayNameProperty}~rename(name)`
        )
const getQueryOptions = (displayNameProperty: string) => ({
    programs: {
        resource: 'programs',
        params: {
            ...sharedParams,
            fields: replaceDisplayNameProperty(
                programFields,
                displayNameProperty
            ),
        },
    },
    trackedEntityTypes: {
        resource: 'trackedEntityTypes',
        params: {
            ...sharedParams,
            fields: replaceDisplayNameProperty(
                trackedEntityTypeFields,
                displayNameProperty
            ),
        },
    },
})

export const useDataSourceOptions = (): UseDataSourceOptionsResult => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const { isLoading, isError, error, data } = useRtkQuery<ResponseData>(
        getQueryOptions(displayNameProperty)
    )
    const [filterString, setFilterString] = useState('')
    const [visibleProgramsLength, setVisibleProgramsLength] = useState(
        LIST_LENGTH_INCREMENTER
    )
    const [visibleTrackedEntityTypeLength, setVisibleTrackedEntityTypeLength] =
        useState(LIST_LENGTH_INCREMENTER)
    const onFilterStringChange = useCallback(({ value = '' }) => {
        setFilterString(value)
    }, [])
    const [programs, hasMorePrograms] = useMemo<[ProgramData[], boolean]>(
        () =>
            filterByNameWithMaxLength(
                filterString,
                visibleProgramsLength,
                data?.programs.programs
            ),
        [filterString, data, visibleProgramsLength]
    )
    const [trackedEntityTypes, hasMoreTrackedEntityTypes] = useMemo<
        [TrackedEntityTypeData[], boolean]
    >(
        () =>
            filterByNameWithMaxLength(
                filterString,
                visibleTrackedEntityTypeLength,
                data?.trackedEntityTypes.trackedEntityTypes
            ),
        [filterString, data, visibleTrackedEntityTypeLength]
    )

    return useMemo<UseDataSourceOptionsResult>(
        () => ({
            isLoading,
            isError,
            error,
            programs,
            trackedEntityTypes,
            hasMorePrograms,
            hasMoreTrackedEntityTypes,
            filterString,
            onFilterStringChange: onFilterStringChange,
            onShowMoreProgramsClick: () =>
                setVisibleProgramsLength(
                    (curr) => curr + LIST_LENGTH_INCREMENTER
                ),
            onShowMoreTrackedEntityTypesClick: () =>
                setVisibleTrackedEntityTypeLength(
                    (curr) => curr + LIST_LENGTH_INCREMENTER
                ),
        }),
        [
            error,
            filterString,
            isError,
            isLoading,
            onFilterStringChange,
            programs,
            trackedEntityTypes,
            hasMorePrograms,
            hasMoreTrackedEntityTypes,
        ]
    )
}
