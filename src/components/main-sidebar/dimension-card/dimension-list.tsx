import i18n from '@dhis2/d2-i18n'
import { CircularLoader, IconErrorFilled16 } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import { DimensionListItem } from './dimension-list-item'
import classes from './styles/dimension-list.module.css'
import type { EngineError } from '@api/parse-engine-error'
import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'
import { SkeletonChip } from '@components/shared/skeleton-chip'
import type { Program, ProgramStage } from '@types'

type DimensionListProps = UseDimensionListResult & {
    program?: Program
    programStage?: ProgramStage
}

const ErrorListItem: FC<{ error: EngineError; isEmptyList: boolean }> = ({
    error,
    isEmptyList,
}) => (
    <li
        data-test="dimension-list-error-list-item"
        className={cx(classes.error, { [classes.emptyListError]: isEmptyList })}
    >
        <p>
            <IconErrorFilled16 />
            {isEmptyList
                ? i18n.t(
                      'There was a problem and this data could not be loaded'
                  )
                : i18n.t('There was problem loading more data')}
        </p>
        {error?.errorCode && <p>{error.errorCode}</p>}
    </li>
)

const LoaderSkeleton: FC<{ count?: number }> = ({ count = 5 }) =>
    Array.from({ length: count }).map((_, index) => (
        <li
            key={`loader-skeleton${index}`}
            data-test="dimension-list-skeleton-list-item"
        >
            <SkeletonChip width="100%" />
        </li>
    ))

const DimensionListContent: FC<DimensionListProps> = ({
    dimensions,
    isLoading,
    isDisabledByFilter,
    isFetchingMore,
    error,
    hasMore,
    hasNoData,
    loadMore,
    program,
    programStage,
}) => {
    if (isLoading) {
        return <LoaderSkeleton />
    }

    if (!error && (isDisabledByFilter || dimensions.length === 0)) {
        return (
            <li
                data-test="dimension-list-empty-list-item"
                className={hasNoData ? classes.noData : classes.noResults}
            >
                {hasNoData ? i18n.t('No data found') : i18n.t('No results')}
            </li>
        )
    }

    return (
        <>
            {dimensions.map((dimension) => (
                <DimensionListItem
                    key={dimension.id}
                    dimension={dimension}
                    program={program}
                    programStage={programStage}
                />
            ))}
            {error && (
                <ErrorListItem
                    error={error}
                    isEmptyList={dimensions.length === 0}
                />
            )}
            {hasMore && !isFetchingMore && !error && (
                <li
                    className={classes.loadMore}
                    data-test="dimension-list-load-more-list-item"
                >
                    <button
                        data-test="dimension-list-load-more-button"
                        onClick={loadMore}
                    >
                        {i18n.t('Load more')}
                    </button>
                </li>
            )}
            {isFetchingMore && (
                <li
                    className={classes.loadingMore}
                    data-test="dimension-list-loading-more-list-item"
                >
                    <CircularLoader extrasmall />
                    <span>{i18n.t('Loading more...')}</span>
                </li>
            )}
        </>
    )
}

export const DimensionList: FC<DimensionListProps> = (props) => {
    return (
        <ul className={classes.list} data-test="dimension-list">
            <DimensionListContent {...props} />
        </ul>
    )
}
