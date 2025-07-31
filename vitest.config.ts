import react from '@vitejs/plugin-react'
// eslint-disable-next-line import/no-unresolved
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
        resolveSnapshotPath: (testPath, snapExtension) => {
            const testPathParts = testPath.split('/')
            const file = testPathParts.pop()

            return `${testPathParts.join(
                '/'
            )}/test-snapshots/${file}${snapExtension}`
        },
    },
})
