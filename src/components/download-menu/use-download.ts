import type { DownloadFn } from './types'

type UseDownloadResult = {
    isDownloadDisabled: boolean
    download: DownloadFn
}

const useDownload = (): UseDownloadResult => ({
    isDownloadDisabled: false,
    download: (type, format, idScheme) => {
        console.log(
            `TBD (type: ${type}, format: ${format}, idScheme: ${idScheme})`
        )

        return
    },
})

export { useDownload }
