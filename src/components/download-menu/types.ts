type DownloadType = 'table' | 'plain'
export type FileFormat =
    | 'csv'
    | 'html+css'
    | 'jrxml'
    | 'json'
    | 'xls'
    | 'xlsx'
    | 'xml'
    | 'sql'
type IdScheme = 'UID' | 'CODE' | 'NAME'

type DownloadFnArgs = {
    type: DownloadType
    format: FileFormat
    idScheme?: IdScheme
    path?: string
}

export type DownloadFn = (args: DownloadFnArgs) => void
