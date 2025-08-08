import react from '@vitejs/plugin-react'
import { defineConfig, configDefaults } from 'vitest/config'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        setupFiles: './vitest.setup.ts',
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, '**/.d2/**'],
    },
})
