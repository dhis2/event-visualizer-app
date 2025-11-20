// eslint-disable-next-line no-restricted-imports
import { useConfig, useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useState } from 'react'
import type { DownloadFn } from './types'
import {
    getAdaptedVisualization,
    getAnalyticsEndpoint,
} from '@components/plugin-wrapper/hooks/query-tools-line-list'
import { Analytics } from '@dhis2/analytics'
import { useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationValid } from '@modules/validation'
import {
    isVisualizationWithTimeDimension,
    transformVisualization,
} from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import type { CurrentVisualization } from '@types'

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

    const currentVis = useAppSelector(getCurrentVis) as CurrentVisualization
    const currentUser = useCurrentUser()

    const downloadForLL: DownloadFn = useCallback(
        (type, format, idScheme) => {
            if (!currentVis) {
                return false
            }

            let target = '_top'

            const visualization = transformVisualization(currentVis)

            const { adaptedVisualization, headers, parameters } =
                getAdaptedVisualization(visualization)

            let req = new analyticsEngine.request()
                .withPath(
                    `${getAnalyticsEndpoint(visualization.outputType)}/query`
                )
                .withFormat(format)
                .withDisplayProperty(currentUser.settings.displayProperty)

            // TEI can use multiple programs
            if (visualization.outputType !== 'TRACKED_ENTITY_INSTANCE') {
                req = req
                    .withProgram(visualization.program?.id)
                    .withOutputType(visualization.outputType)
            }

            if (visualization.outputType === 'EVENT') {
                req = req.withStage(visualization.programStage?.id)
            }

            if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
                // can use multiple programs, so we cannot pass program here
                req = req.withTrackedEntityType(
                    visualization.trackedEntityType?.id
                )
            }

            if (
                relativePeriodDate &&
                isVisualizationWithTimeDimension(visualization)
            ) {
                req = req.withRelativePeriodDate(relativePeriodDate)
            }

            const sorting = visualization.sorting?.[0]

            if (sorting) {
                switch (sorting.direction) {
                    case 'ASC': {
                        req = req.withAsc(sorting.dimension)
                        break
                    }
                    case 'DESC': {
                        req = req.withDesc(sorting.dimension)
                        break
                    }
                }
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
                    if (idScheme === 'NAME') {
                        req = req.withParameters({
                            dataIdScheme: idScheme,
                        })
                    } else {
                        req = req.withOutputIdScheme(idScheme)
                    }

                    target = ['csv', 'xsl', 'xslx'].includes(format)
                        ? '_top'
                        : '_blank'
                    break
            }

            const url = new URL(
                `${config.baseUrl}/api/${config.apiVersion}/${req.buildUrl()}`,
                `${window.location.origin}${window.location.pathname}`
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
    const isDownloadEnabled = isVisualizationValid(currentVis, { dryRun: true })

    return {
        isDownloadDisabled: !isDownloadEnabled,
        download: downloadForLL,
    }
}

export { useDownload }
