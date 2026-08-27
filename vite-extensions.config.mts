import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { importAliases } from './import-aliases.mjs'

const HOST_PAGE_ROUTE = '/plugin-host.html'
const HOST_PAGE_DIR = 'src/plugin-host'

/* Vite's `root` is `.d2/shell`, so a page kept in `src` is outside it and must
 * be served by hand, with its entry referenced via `/@fs`. Dev only: never
 * added to `build.rollupOptions.input`, so it cannot be built. */
const servePluginHost = (): Plugin => ({
    name: 'event-visualizer:serve-plugin-host',
    apply: 'serve',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            const [pathname] = (req.url ?? '').split('?')

            if (pathname !== HOST_PAGE_ROUTE) {
                next()
                return
            }

            const shellPath = path.resolve(
                process.cwd(),
                HOST_PAGE_DIR,
                'index.html'
            )
            const entryPath = path.resolve(
                process.cwd(),
                HOST_PAGE_DIR,
                'main.tsx'
            )

            fs.readFile(shellPath, 'utf8')
                .then((shell) =>
                    server.transformIndexHtml(
                        HOST_PAGE_ROUTE,
                        shell.replace('__ENTRY_MODULE__', `/@fs${entryPath}`)
                    )
                )
                .then((html) => {
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'text/html')
                    res.end(html)
                })
                .catch(next)
        })
    },
})

const viteConfig = defineConfig(async (configEnv) => {
    const { mode } = configEnv
    return {
        // In dev environments, don't clear the terminal after files update
        clearScreen: mode !== 'development',
        resolve: { alias: importAliases },
        plugins: [servePluginHost()],
    }
})

export default viteConfig
