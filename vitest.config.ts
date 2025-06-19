import react from '@vitejs/plugin-react'
// eslint-disable-next-line import/no-unresolved
import { defineConfig, configDefaults } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        setupFiles: './vitest.setup.ts',
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, '**/.d2/**'],
    },
})
