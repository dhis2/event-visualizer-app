import { FetchError } from '@dhis2/app-runtime'

export const ENGINE_ERROR_TYPES = [
    'network',
    'aborted',
    'access',
    'unknown',
    'runtime',
] as const
export type EngineErrorType = (typeof ENGINE_ERROR_TYPES)[number]

export type ResponseErrorReport = {
    args: Array<string | number>
    errorCode: string
    errorKlass: string
    errorProperties: Array<string | number>
    errorProperty: string
    mainKlass: string
    message: string
}

type ErrorReport = Omit<
    ResponseErrorReport,
    'args' | 'errorKlass' | 'mainKlass'
>

export type EngineError = {
    type: EngineErrorType
    message: string
    httpStatusCode?: number
    httpStatus?: string
    errorCode?: string
    errorCodes?: Array<string>
    uid?: string
    errorReports?: Array<ErrorReport>
}

function cleanErrorReport(errorReport: ResponseErrorReport): ErrorReport {
    return {
        errorCode: errorReport.errorCode,
        errorProperties: errorReport.errorProperties,
        errorProperty: errorReport.errorProperty,
        message: errorReport.message,
    }
}

export const parseEngineError = (error: unknown): EngineError => {
    if (error instanceof FetchError) {
        const { type, message, details } = error
        // Use shared type list for runtime check
        const errorType: EngineErrorType = ENGINE_ERROR_TYPES.includes(
            type as EngineErrorType
        )
            ? (type as EngineErrorType)
            : 'unknown'
        const parsedError: EngineError = {
            type: errorType,
            message: typeof message === 'string' ? message : 'Unknown error',
            httpStatusCode:
                typeof details?.httpStatusCode === 'number'
                    ? details.httpStatusCode
                    : undefined,
            httpStatus:
                typeof details?.httpStatus === 'string'
                    ? details.httpStatus
                    : undefined,
            errorCode:
                typeof details?.errorCode === 'string'
                    ? details.errorCode
                    : undefined,
            uid:
                typeof details?.response?.uid === 'string'
                    ? details.response.uid
                    : undefined,
            errorReports: Array.isArray(details?.response?.errorReports)
                ? details.response.errorReports.map(cleanErrorReport)
                : undefined,
        }

        /* If we end up with an error without an errorCode, try to read them
         * from the errorReports */
        if (!parsedError.errorCode && parsedError.errorReports?.length) {
            if (parsedError.errorReports.length === 1) {
                parsedError.errorCode = parsedError.errorReports[0].errorCode
            } else {
                parsedError.errorCodes = parsedError.errorReports.map(
                    ({ errorCode }) => errorCode
                )
            }
        }

        return parsedError
    }

    return {
        type: 'runtime',
        message:
            error instanceof Error && typeof error.message === 'string'
                ? error.message
                : 'An unexpected runtime error occurred',
    }
}
