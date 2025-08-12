/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require('@dhis2/cli-style')

module.exports = {
    ...require(config.prettier),
}
