type DownloadType = 'table' | 'plain'
export type FileFormat = 'csv' | 'html+css' | 'json' | 'xls' | 'xlsx' | 'xml'
type IdScheme = 'UID' | 'CODE' | 'NAME'

type DownloadFnArgs = {
    type: DownloadType
    format: FileFormat
    idScheme?: IdScheme
}

export type DownloadFn = (args: DownloadFnArgs) => void
