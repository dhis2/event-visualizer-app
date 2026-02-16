import { useCallback, useMemo, useState } from 'react'
import { useCurrentUser, useRtkQuery } from '@hooks'
import { getProgramFields, getTrackedEntityTypeFields } from '@modules/query'
import type {
    CurrentUser,
    MetadataItemWithName,
    ProgramMetadataItem,
    UseRtkQueryResult,
} from '@types'

const sharedParams = { filter: 'access.data.read:eq:true', paging: false }

type ResponseData = {
    programs: {
        programs: ProgramMetadataItem[]
    }
    trackedEntityTypes: {
        trackedEntityTypes: MetadataItemWithName[]
    }
}
type OnFilterStringChangePayload = {
    value: string | undefined
}
export type UseDataSourceOptionsResult = Pick<
    UseRtkQueryResult<ResponseData>,
    'isLoading' | 'isError' | 'error'
> & {
    programs: ProgramMetadataItem[]
    trackedEntityTypes: MetadataItemWithName[]
    filterString: string
    hasMorePrograms: boolean
    hasMoreTrackedEntityTypes: boolean
    shouldShowFilter: boolean
    onFilterStringChange: (payload: OnFilterStringChangePayload) => void
    onShowMoreProgramsClick: () => void
    onShowMoreTrackedEntityTypesClick: () => void
}

export const LIST_LENGTH_INCREMENTER = 10

function filterByNameWithMaxLength<T extends { name: string }>(
    filterString: string,
    visibleListLength: number,
    list?: Array<T>
): [T[], boolean] {
    if (!list) {
        return [[], false]
    }
    const lowerCasedFilterString = filterString.toLocaleLowerCase()
    const filteredList = list
        .filter((item) =>
            item?.name?.toLocaleLowerCase().includes(lowerCasedFilterString)
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    const slicedList = filteredList.slice(
        0,
        Math.min(visibleListLength, filteredList.length)
    )
    const hasMore = filteredList.length > slicedList.length
    return [slicedList, hasMore]
}

const getQueryOptions = (
    displayNameProperty: CurrentUser['settings']['displayNameProperty']
) => ({
    programs: {
        resource: 'programs',
        params: {
            ...sharedParams,
            fields: getProgramFields(displayNameProperty),
        },
    },
    trackedEntityTypes: {
        resource: 'trackedEntityTypes',
        params: {
            ...sharedParams,
            fields: getTrackedEntityTypeFields(displayNameProperty),
        },
    },
})

export const useDataSourceOptions = (
    listLengthIncrementer: number = LIST_LENGTH_INCREMENTER
): UseDataSourceOptionsResult => {
    const {
        settings: { displayNameProperty },
    } = useCurrentUser()
    const { isLoading, isError, error, data } = useRtkQuery<ResponseData>(
        getQueryOptions(displayNameProperty)
    )
    const [filterString, setFilterString] = useState('')
    const [visibleProgramsLength, setVisibleProgramsLength] = useState(
        listLengthIncrementer
    )
    const [visibleTrackedEntityTypeLength, setVisibleTrackedEntityTypeLength] =
        useState(listLengthIncrementer)
    const onFilterStringChange = useCallback(({ value = '' }) => {
        setFilterString(value)
    }, [])

    return useMemo<UseDataSourceOptionsResult>(() => {
        const [programs, hasMorePrograms] = filterByNameWithMaxLength(
            filterString,
            visibleProgramsLength,
            data?.programs.programs
        )

        const [trackedEntityTypes, hasMoreTrackedEntityTypes] =
            filterByNameWithMaxLength(
                filterString,
                visibleTrackedEntityTypeLength,
                data?.trackedEntityTypes.trackedEntityTypes
            )

        const shouldShowFilter =
            (data?.programs.programs.length ?? 0) +
                (data?.trackedEntityTypes.trackedEntityTypes.length ?? 0) >
            listLengthIncrementer

        return {
            isLoading,
            isError,
            error,
            programs,
            trackedEntityTypes,
            hasMorePrograms,
            hasMoreTrackedEntityTypes,
            shouldShowFilter,
            filterString,
            onFilterStringChange: onFilterStringChange,
            onShowMoreProgramsClick: () =>
                setVisibleProgramsLength(
                    (curr) => curr + listLengthIncrementer
                ),
            onShowMoreTrackedEntityTypesClick: () =>
                setVisibleTrackedEntityTypeLength(
                    (curr) => curr + listLengthIncrementer
                ),
        }
    }, [
        data,
        error,
        filterString,
        isError,
        isLoading,
        listLengthIncrementer,
        onFilterStringChange,
        visibleProgramsLength,
        visibleTrackedEntityTypeLength,
    ])
}
