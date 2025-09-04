import type { DownloadFn } from './types'

type UseDownloadResult = {
    isDownloadDisabled: boolean
    download: DownloadFn
}

const useDownload = (): UseDownloadResult => ({
    isDownloadDisabled: true, // TODO replace this with a layout validation result
    download: (type, format, idScheme) => {
        console.log(
            `TBD (type: ${type}, format: ${format}, idScheme: ${idScheme})`
        )

        return
    },
})

export { useDownload }
