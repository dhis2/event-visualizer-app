/* The prefix marks objects the E2E suite creates, so leftovers on a shared
 * instance are easy to find; the timestamp keeps parallel runs apart. */
export const testObjectName = (label: string) =>
    `E2E-IDV ${label} ${new Date().toISOString()}`
