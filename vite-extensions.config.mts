import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const viteConfig = defineConfig(async (configEnv) => {
    const { mode } = configEnv
    return {
        // In dev environments, don't clear the terminal after files update
        clearScreen: mode !== 'development',
        // Use an import alias: import from '@/' anywhere instead of 'src/'
        plugins: [tsconfigPaths()],
    }
})

// eslint-disable-next-line import/no-default-export
export default viteConfig
