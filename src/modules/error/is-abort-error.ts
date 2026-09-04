import { parseEngineError } from '@api/parse-engine-error'
import { FetchError } from '@dhis2/app-runtime'

/* A cancelled request (e.g. superseded by a newer one) is not a failure to
 * surface, so the hooks skip it rather than routing it to a boundary. */
export const isAbortError = (error: unknown): boolean =>
    error instanceof FetchError && parseEngineError(error).type === 'aborted'
