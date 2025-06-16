import { FetchError } from '@dhis2/app-runtime'

export type EngineError =
    | {
          type: 'network'
          message: string
      }
    | {
          type: 'access'
          message: string
          httpStatusCode?: number
          httpStatus?: string
          errorCode?: string
      }
    | {
          type: 'unknown'
          message: string
          httpStatusCode?: number
          httpStatus?: string
          errorCode?: string
      }
    | {
          type: 'runtime'
          message: string
      }

export const parseEngineError = (error: unknown): EngineError => {
    if (error instanceof FetchError) {
        const { type, message, details } = error
        // FetchError instances are flattened. No properties under details.
        const base = {
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
        }

        switch (type) {
            case 'network':
                return { type: 'network', message: base.message }
            case 'access':
                return { type: 'access', ...base }
            case 'unknown':
                return { type: 'unknown', ...base }
            default:
                return { type: 'unknown', message: base.message }
        }
    }

    return {
        type: 'runtime',
        message:
            error instanceof Error && typeof error.message === 'string'
                ? error.message
                : 'An unexpected runtime error occurred',
    }
}
