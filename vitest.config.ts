import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export const importAliases = {
    '@types': path.resolve(__dirname, 'src/types/index.ts'),
    '@hooks': path.resolve(__dirname, 'src/hooks/index.ts'),
    '@api': path.resolve(__dirname, 'src/api'),
    '@assets': path.resolve(__dirname, 'src/assets'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@constants': path.resolve(__dirname, 'src/constants'),
    '@modules': path.resolve(__dirname, 'src/modules'),
    '@store': path.resolve(__dirname, 'src/store'),
    '@test-utils': path.resolve(__dirname, 'src/test-utils'),
}

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig({
    plugins: [react()],
    resolve: { alias: importAliases },
    test: {
        setupFiles: './vitest.setup.ts',
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, '**/.d2/**'],
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
