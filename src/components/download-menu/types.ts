type DownloadType = 'table' | 'plain'
export type FileFormat = 'html+css' | 'csv' | 'xls' | 'xlsx' | 'json' | 'xml'
type IdScheme = 'UID' | 'CODE' | 'NAME'

export type DownloadFn = (
    type: DownloadType,
    format: FileFormat,
    idScheme?: IdScheme
) => void
