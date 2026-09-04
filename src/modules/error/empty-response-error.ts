/* An empty analytics response, modelled as an error so "no data" takes the same
 * canvas error path as a real failure. */
export class EmptyResponseError extends Error {
    constructor() {
        super('No data')
        this.name = 'EmptyResponseError'
    }
}
