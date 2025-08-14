import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { importAliases } from './vitest.config'

// This config is used for Cypress component testing
// eslint-disable-next-line import/no-default-export
export default defineConfig({
    plugins: [react()],
    root: '.',
    resolve: { alias: importAliases },
    // Use the Cypress-specific index.html for mounting components
    publicDir: false,
    server: {
        // Vite will use this as the entry HTML for Cypress component tests
        open: false,
    },
    // Tell Vite to use the Cypress component index.html
    // This is picked up by @cypress/vite-dev-server automatically if set as index.html in support dir
    // But we can be explicit:
    appType: 'custom',
    // Vite will use this as the entry HTML for Cypress component tests
    // (Cypress will copy this to a temp dir and serve it)
    // No need to specify index.html path if it's named component-index.html in cypress/support
})
