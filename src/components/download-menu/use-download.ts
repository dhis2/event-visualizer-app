import type { DownloadFn } from './types'

type UseDownloadResult = {
    isDownloadDisabled: boolean
    download: DownloadFn
}

const useDownload: (relativePeriodDate?: string) => UseDownloadResult = (
    relativePeriodDate
) => ({
    isDownloadDisabled: true, // TODO replace this with a layout validation result
    download: (type, format, idScheme) => {
        console.log(
            `TBD (type: ${type}, format: ${format}, idScheme: ${idScheme}, relativePeriodDate: ${relativePeriodDate})`
        )

        return
    },
})

export { useDownload }
