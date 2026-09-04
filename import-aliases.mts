import path from 'node:path'

export const importAliases = {
    '@types': path.resolve(import.meta.dirname, 'src/types/index.ts'),
    '@hooks': path.resolve(import.meta.dirname, 'src/hooks/index.ts'),
    '@api': path.resolve(import.meta.dirname, 'src/api'),
    '@assets': path.resolve(import.meta.dirname, 'src/assets'),
    '@components': path.resolve(import.meta.dirname, 'src/components'),
    '@constants': path.resolve(import.meta.dirname, 'src/constants'),
    '@modules': path.resolve(import.meta.dirname, 'src/modules'),
    '@store': path.resolve(import.meta.dirname, 'src/store'),
    '@test-utils': path.resolve(import.meta.dirname, 'src/test-utils'),
}
