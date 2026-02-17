import i18n from '@dhis2/d2-i18n'
import { IconErrorFilled16 } from '@dhis2/ui'
import cx from 'classnames'
import type { FC } from 'react'
import { DimensionListItem } from './dimension-list-item'
import classes from './styles/dimension-list.module.css'
import type { EngineError } from '@api/parse-engine-error'
import type { UseDimensionListResult } from '@components/main-sidebar/use-dimension-list'
import { SkeletonChip } from '@components/shared/skeleton-chip'

const ErrorListItem: FC<{ error: EngineError; isEmptyList: boolean }> = ({
    error,
    isEmptyList,
}) => (
    <li
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

const LoaderSkeleton: FC = () => (
    <>
        <li>
            <SkeletonChip width="100%" />
        </li>
        <li>
            <SkeletonChip width="100%" />
        </li>
        <li>
            <SkeletonChip width="100%" />
        </li>
    </>
)

const error: EngineError = {
    message: 'Oopsie!',
    type: 'runtime',
    errorCode: 'TSTS',
}
const dimensions = []

const DimensionListContent: FC<UseDimensionListResult> = ({
    dimensions: whatDimensions,
    isLoading,
    isDisabledByFilter,
    isLoadingMore,
    error: whatError,
    hasMore,
    hasNoData,
    loadMore,
}) => {
    if (isLoading) {
        return <LoaderSkeleton />
    }

    if (!error && (isDisabledByFilter || dimensions.length === 0)) {
        return (
            <li>
                {hasNoData ? i18n.t('No data found') : i18n.t('No results')}
            </li>
        )
    }

    return (
        <>
            {dimensions.map((dimension) => (
                <DimensionListItem key={dimension.id} dimension={dimension} />
            ))}
            {error && (
                <ErrorListItem
                    error={error}
                    isEmptyList={dimensions.length === 0}
                />
            )}
            {hasMore && !isLoadingMore && !error && (
                <li onClick={loadMore}>{i18n.t('Show more')}</li>
            )}
            {isLoadingMore && <li>{i18n.t('Load more')}</li>}
        </>
    )
}

export const DimensionList: FC<UseDimensionListResult> = (props) => {
    return (
        <ul className={classes.list} data-test="dimension-list">
            <DimensionListContent {...props} />
        </ul>
    )
}
