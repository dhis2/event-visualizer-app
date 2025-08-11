import { defineConfig } from 'vite'
import { importAliases } from './vitest.config'

const viteConfig = defineConfig(async (configEnv) => {
    const { mode } = configEnv
    return {
        // In dev environments, don't clear the terminal after files update
        clearScreen: mode !== 'development',
        resolve: { alias: importAliases },
    }
})

// eslint-disable-next-line import/no-default-export
export default viteConfig
