/* A feature deliberately left out of this prototype, modelled as an error so it
 * takes the same canvas path as "no data" instead of crashing the app. */
export class PrototypeUnsupportedError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PrototypeUnsupportedError'
    }
}
