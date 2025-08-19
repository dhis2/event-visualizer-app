import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, configDefaults } from 'vitest/config'

export const importAliases = {
    '@types': path.resolve(__dirname, 'src/types/index.ts'),
    '@api': path.resolve(__dirname, 'src/api/index.ts'),
    '@constants': path.resolve(__dirname, 'src/constants/index.ts'),
    '@hooks': path.resolve(__dirname, 'src/hooks/index.ts'),
    '@modules': path.resolve(__dirname, 'src/modules/index.ts'),
    '@store': path.resolve(__dirname, 'src/store/index.ts'),
    '@test-utils': path.resolve(__dirname, 'src/test-utils/index.tsx'),
    '@assets': path.resolve(__dirname, 'src/assets'),
    '@components': path.resolve(__dirname, 'src/components'),
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
    },
})
