/* Its own file so error-codes.ts can use it without importing
 * get-error-display.ts, which imports error-codes.ts.
 *
 * 'emptyBox' means nothing came back, 'data' points at the data or the access
 * to it, 'generic' is everything else. */
export type CanvasErrorIcon = 'emptyBox' | 'data' | 'generic'
