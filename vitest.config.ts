import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, configDefaults } from 'vitest/config'

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
            if (type === 'stderr' && log.includes('Highcharts warning')) {
                return false
            }
        },
    },
})
