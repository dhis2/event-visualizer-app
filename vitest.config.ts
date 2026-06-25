import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { importAliases } from './import-aliases'

// https://vitejs.dev/config/

export default defineConfig({
    plugins: [react()],
    resolve: { alias: importAliases },
    test: {
        setupFiles: './vitest.setup.ts',
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, '**/.d2/**', '**/.claude/**'],
        onConsoleLog(log, type) {
            // Suppress Highcharts warnings
            if (
                type === 'stderr' &&
                log.includes(
                    'Highcharts warning #26: www.highcharts.com/errors/26/'
                )
            ) {
                return false
            }
            // Suppress styled-jsx StyleSheet warnings from DHIS2 UI components
            if (type === 'stderr' && log.includes('StyleSheet: illegal rule')) {
                return false
            }

            // This message was coming from analytics so we can't fix it
            if (
                type === 'stdout' &&
                log.includes(
                    'Button component has no children but is missing title and ariaLabel attribute'
                )
            ) {
                return false
            }

            // For tests this is not helpful. You may want to assert the whole state
            if (
                type === 'stderr' &&
                log.includes(
                    'Selector unknown returned the root state when called. This can lead to unnecessary rerenders.'
                )
            ) {
                return false
            }
        },
    },
})
