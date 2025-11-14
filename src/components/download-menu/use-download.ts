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
    download: DownloadFn | undefined
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

            switch (visualization.outputType) {
                case 'TRACKED_ENTITY_INSTANCE':
                    req = req.withTrackedEntityType(
                        visualization.trackedEntityType?.id
                    )
                    break
                default:
                    req = req
                        .withProgram(visualization.program?.id)
                        .withOutputType(visualization.outputType)
                    break
            }

            if (visualization.outputType === 'EVENT') {
                req = req.withStage(visualization.programStage?.id)
            }

            switch (type) {
                case 'table':
                    req = req
                        .fromVisualization(adaptedVisualization)
                        .withTableLayout()
                        .withColumns(
                            visualization.columns
                                ?.filter((column) => column.dimension !== 'dy')
                                .map((column) => column.dimension)
                                .join(';')
                        )
                        // XXX: not the case for LL
                        //.withRows(
                        //    visualization.rows
                        //        ?.filter((row) => row.dimension !== 'dy')
                        //        .map((row) => row.dimension)
                        //        .join(';')
                        //)
                        .withParameters({
                            ...parameters,
                            headers,
                            dataIdScheme: 'NAME',
                            paging: false,
                        }) // only for LL

                    //TODO:
                    //displayPropertyName
                    //completedOnly (from options)
                    //hideEmptyColumns (from options)
                    //hideEmptyRows (from options)
                    //showHierarchy (from options)
                    //startDate
                    //endDate
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

                    // TODO: options
                    // startDate
                    // endDate
                    // completedOnly
                    // hierarchyMeta (from options)
                    // outputType
                    // programStatus
                    // eventStatus
                    // limit
                    // sortOrder
                    // value
                    // aggregationType
                    // timeField
                    // orgUnitField
                    // collapsedDataDimensions
                    // useOrgUnit (URL)
                    // relativePeriodDate
                    target = ['csv', 'xsl', 'xslx'].includes(format)
                        ? '_top'
                        : '_blank'
                    break
            }

            // TODO: add common parameters
            // if there are for both event/enrollment and PT/LL

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
        download: isDownloadEnabled ? downloadForLL : undefined,
    }
}

export { useDownload }
