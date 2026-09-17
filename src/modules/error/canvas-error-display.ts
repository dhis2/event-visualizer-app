/* Its own file so error-codes.ts and get-error-display.ts can both use these
 * without importing each other.
 *
 * 'emptyBox' means nothing came back, 'data' points at the data or the access
 * to it, 'generic' is everything else. */
export type CanvasErrorIcon = 'emptyBox' | 'data' | 'generic'

/* A screen renders without a Retry unless `retryable` says trying the same
 * request again can succeed. */
export type CanvasErrorDisplay = {
    icon: CanvasErrorIcon
    title: string
    description: string
    retryable?: boolean
}
