import {
    getAdaptedVisualization as getAdaptedVisualizationForLL,
    getAnalyticsEndpoint,
} from '@components/plugin-wrapper/hooks/query-tools-line-list'
import { getAdaptedVisualization as getAdaptedVisualizationForPT } from '@components/plugin-wrapper/hooks/query-tools-pivot-table'
import { Analytics } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { useConfig, useDataEngine } from '@dhis2/app-runtime'
import { useAppSelector, useCurrentUser } from '@hooks'
import {
    getSingleProgramFromVisualization,
    isCurrentVisualizationNew,
    isCurrentVisualizationPersisted,
    isVisualizationEmpty,
    isVisualizationWithTimeDimension,
    transformVisualizationForAnalyticsRequest,
} from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { useCallback, useState } from 'react'
import type { DownloadFn } from './types'

type UseDownloadResult = {
    isDownloadDisabled: boolean
    download: DownloadFn
}

const useDownload: (relativePeriodDate?: string) => UseDownloadResult = (
    relativePeriodDate
) => {
    const config = useConfig()
    const dataEngine = useDataEngine()
    const [analyticsEngine] = useState(() => Analytics.getAnalytics(dataEngine))

    const currentVis = useAppSelector(getCurrentVis)
    const currentUser = useCurrentUser()

    const downloadForLL: DownloadFn = useCallback(
        ({ type, format, idScheme }) => {
            if (isVisualizationEmpty(currentVis)) {
                return
            }

            let target = '_top'

            const visualization =
                transformVisualizationForAnalyticsRequest(currentVis)

            const { adaptedVisualization, headers, parameters } =
                getAdaptedVisualizationForLL(visualization)

            let req = new analyticsEngine.request()
                .withPath(
                    `${getAnalyticsEndpoint(visualization.outputType)}/query`
                )
                .withFormat(format)
                .withDisplayProperty(currentUser.settings.displayProperty)

            // TEI can use multiple programs
            if (visualization.outputType !== 'TRACKED_ENTITY_INSTANCE') {
                req = req
                    .withProgram(
                        getSingleProgramFromVisualization(visualization).id
                    )
                    .withOutputType(visualization.outputType)
            } else if (visualization.trackedEntityType?.id) {
                req = req.withTrackedEntityType(
                    visualization.trackedEntityType.id
                )
            }

            if (
                relativePeriodDate &&
                isVisualizationWithTimeDimension(visualization)
            ) {
                req = req.withRelativePeriodDate(relativePeriodDate)
            }

            const sorting = visualization.sorting?.[0]
            if (sorting?.direction === 'ASC') {
                req = req.withAsc(sorting.dimension)
            } else if (sorting?.direction === 'DESC') {
                req = req.withDesc(sorting.dimension)
            }

            switch (type) {
                case 'table':
                    req = req
                        .fromVisualization(adaptedVisualization)
                        .withTableLayout()
                        .withColumns(
                            visualization.columns
                                ?.map((column) => column.dimension)
                                .join(';')
                        )
                        .withParameters({
                            ...parameters,
                            headers,
                            dataIdScheme: 'NAME',
                            paging: false,
                        })

                    target = format === 'html+css' ? '_blank' : '_top'

                    break
                case 'plain':
                    req = req
                        // Perhaps the 2nd arg `passFilterAsDimension` should be false for the advanced submenu?
                        .fromVisualization(adaptedVisualization, true)
                        .withParameters({
                            ...parameters,
                            headers,
                            paging: false,
                        })

                    // fix option set option names
                    req =
                        idScheme === 'NAME'
                            ? req.withParameters({ dataIdScheme: idScheme })
                            : req.withOutputIdScheme(idScheme)

                    target = ['csv', 'xsl', 'xslx'].includes(format)
                        ? '_top'
                        : '_blank'
                    break
            }

            const url = new URL(
                `${config.baseUrl}/api/${config.apiVersion}/${req.buildUrl()}`,
                `${globalThis.location.origin}${globalThis.location.pathname}`
            )

            Object.entries(req.buildQuery()).forEach(([key, value]) =>
                // TODO: buildQuery return value should be typed to avoid the need of the String casting
                url.searchParams.append(key, String(value))
            )

            window.open(url, target)
        },
        [
            analyticsEngine,
            config.baseUrl,
            config.apiVersion,
            currentVis,
            currentUser.settings,
            relativePeriodDate,
        ]
    )

    const downloadForPT: DownloadFn = useCallback(
        ({ type, format, idScheme, path }) => {
            if (isVisualizationEmpty(currentVis)) {
                return
            }

            let target = '_top'

            const visualization =
                transformVisualizationForAnalyticsRequest(currentVis)

            const { adaptedVisualization, parameters } =
                getAdaptedVisualizationForPT(visualization)

            let req = new analyticsEngine.request()
                .withPath(
                    path ??
                        `${getAnalyticsEndpoint(visualization.outputType)}/aggregate`
                )
                .withFormat(format)
                .withDisplayProperty(currentUser.settings.displayProperty)

            const applyBaseOptions = () => {
                if (!path) {
                    req = req.withProgram(
                        getSingleProgramFromVisualization(visualization).id
                    )
                }
                if (visualization.sortOrder) {
                    req = req.withSortOrder(
                        visualization.sortOrder === 1 ? 'ASC' : 'DESC'
                    )
                }
                if (visualization.topLimit) {
                    req = req.withLimit(visualization.topLimit)
                }
                // add custom value and aggregationType
                if (visualization.value && visualization.aggregationType) {
                    req = req
                        .withValue(visualization.value.id)
                        .withAggregationType(visualization.aggregationType)
                }
                if (
                    relativePeriodDate &&
                    isVisualizationWithTimeDimension(visualization)
                ) {
                    req = req.withRelativePeriodDate(relativePeriodDate)
                }
            }
            applyBaseOptions()

            switch (type) {
                case 'table':
                    req = req
                        .fromVisualization(adaptedVisualization)
                        .withTableLayout()
                        .withColumns(
                            visualization.columns
                                ?.map((column) => column.dimension)
                                .join(';')
                        )
                        .withRows(
                            visualization.rows
                                ?.map((row) => row.dimension)
                                .join(';')
                        )
                        .withParameters({
                            ...parameters,
                            dataIdScheme: 'NAME',
                            paging: false,
                        })

                    target = format === 'html+css' ? '_blank' : '_top'

                    break
                case 'plain':
                    req = req
                        // XXX: here we don't get all dimensions since the ones without a condition are skipped
                        .fromVisualization(
                            adaptedVisualization,
                            // XXX: in DV we only pass true when path is dataValueSet, in LL always, we don't have the advanced menu there
                            path ? path === 'dataValueSet' : true
                        )
                        .withParameters({
                            ...parameters,
                            paging: false,
                        })

                    // TODO: showHierarchy:
                    // withShowHierarchy this is equivalent to the withParameters above
                    // withHierarchyMeta this won't be added with just withParameters

                    // fix option set option names
                    req =
                        idScheme === 'NAME'
                            ? req.withParameters({ dataIdScheme: idScheme })
                            : req.withOutputIdScheme(idScheme)

                    target = ['csv', 'xsl', 'xslx'].includes(format)
                        ? '_top'
                        : '_blank'
                    break
            }

            const url = new URL(
                `${config.baseUrl}/api/${config.apiVersion}/${req.buildUrl()}`,
                `${globalThis.location.origin}${globalThis.location.pathname}`
            )

            Object.entries(req.buildQuery()).forEach(([key, value]) =>
                // TODO: buildQuery return value should be typed to avoid the need of the String casting
                url.searchParams.append(key, String(value))
            )

            window.open(url, target)
        },
        [
            analyticsEngine,
            config.baseUrl,
            config.apiVersion,
            currentVis,
            currentUser.settings,
            relativePeriodDate,
        ]
    )

    // XXX: should the transformed visualization be passed here?
    const isDownloadEnabled =
        isCurrentVisualizationNew(currentVis) ||
        isCurrentVisualizationPersisted(currentVis)

    return {
        isDownloadDisabled: !isDownloadEnabled,
        download:
            currentVis.type === 'PIVOT_TABLE' ? downloadForPT : downloadForLL,
    }
}

export { useDownload }
