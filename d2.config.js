/** @type {import('@dhis2/cli-app-scripts').D2Config} */
const config = {
    type: 'app',
    name: 'event-visualizer',
    // id: TBD,
    title: 'Event Visualizer',
    coreApp: true,
    minDHIS2Version: '2.43',
    direction: 'auto',
    pwa: {
        enabled: true,
    },

    entryPoints: {
        app: './src/app.tsx',
    },
}

module.exports = config
