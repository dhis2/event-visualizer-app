import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LOG_LEVEL_KEY = 'EVENT_VISUALIZER_LOG_LEVEL'

const importDebugMode = async () => {
    vi.resetModules()
    return await import('../debug-mode')
}

describe('debug-mode', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.unstubAllEnvs()
    })

    afterEach(() => {
        localStorage.clear()
        vi.unstubAllEnvs()
    })

    describe('default (no localStorage override)', () => {
        it("returns 'info' when NODE_ENV=development", async () => {
            vi.stubEnv('NODE_ENV', 'development')
            const { getLogLevel, isDebugMode } = await importDebugMode()
            expect(getLogLevel()).toBe('info')
            expect(isDebugMode()).toBe(true)
        })

        it("returns 'error' when NODE_ENV=production", async () => {
            vi.stubEnv('NODE_ENV', 'production')
            const { getLogLevel, isDebugMode } = await importDebugMode()
            expect(getLogLevel()).toBe('error')
            expect(isDebugMode()).toBe(false)
        })

        it("returns 'error' when NODE_ENV=test", async () => {
            vi.stubEnv('NODE_ENV', 'test')
            const { getLogLevel, isDebugMode } = await importDebugMode()
            expect(getLogLevel()).toBe('error')
            expect(isDebugMode()).toBe(false)
        })
    })

    describe('localStorage override wins over env default', () => {
        const debugLevels = ['trace', 'debug', 'info'] as const
        const nonDebugLevels = ['warn', 'error', 'silent'] as const
        const envs = ['development', 'production', 'test'] as const

        for (const env of envs) {
            for (const level of debugLevels) {
                it(`'${level}' in ${env} → isDebugMode=true`, async () => {
                    vi.stubEnv('NODE_ENV', env)
                    localStorage.setItem(LOG_LEVEL_KEY, level)
                    const { getLogLevel, isDebugMode } = await importDebugMode()
                    expect(getLogLevel()).toBe(level)
                    expect(isDebugMode()).toBe(true)
                })
            }

            for (const level of nonDebugLevels) {
                it(`'${level}' in ${env} → isDebugMode=false`, async () => {
                    vi.stubEnv('NODE_ENV', env)
                    localStorage.setItem(LOG_LEVEL_KEY, level)
                    const { getLogLevel, isDebugMode } = await importDebugMode()
                    expect(getLogLevel()).toBe(level)
                    expect(isDebugMode()).toBe(false)
                })
            }
        }
    })

    describe('invalid localStorage values fall back to env default', () => {
        it("unknown string in development → 'info'", async () => {
            vi.stubEnv('NODE_ENV', 'development')
            localStorage.setItem(LOG_LEVEL_KEY, 'banana')
            const { getLogLevel } = await importDebugMode()
            expect(getLogLevel()).toBe('info')
        })

        it("unknown string in production → 'error'", async () => {
            vi.stubEnv('NODE_ENV', 'production')
            localStorage.setItem(LOG_LEVEL_KEY, 'banana')
            const { getLogLevel } = await importDebugMode()
            expect(getLogLevel()).toBe('error')
        })

        it('empty string → env default', async () => {
            vi.stubEnv('NODE_ENV', 'production')
            localStorage.setItem(LOG_LEVEL_KEY, '')
            const { getLogLevel } = await importDebugMode()
            expect(getLogLevel()).toBe('error')
        })
    })

    describe('env var override (process.env.EVENT_VISUALIZER_LOG_LEVEL)', () => {
        it('env var overrides env default in production', async () => {
            vi.stubEnv('NODE_ENV', 'production')
            vi.stubEnv(LOG_LEVEL_KEY, 'debug')
            const { getLogLevel, isDebugMode } = await importDebugMode()
            expect(getLogLevel()).toBe('debug')
            expect(isDebugMode()).toBe(true)
        })

        it('env var overrides env default in development', async () => {
            vi.stubEnv('NODE_ENV', 'development')
            vi.stubEnv(LOG_LEVEL_KEY, 'warn')
            const { getLogLevel, isDebugMode } = await importDebugMode()
            expect(getLogLevel()).toBe('warn')
            expect(isDebugMode()).toBe(false)
        })

        it('env var overrides env default in test', async () => {
            vi.stubEnv('NODE_ENV', 'test')
            vi.stubEnv(LOG_LEVEL_KEY, 'trace')
            const { getLogLevel, isDebugMode } = await importDebugMode()
            expect(getLogLevel()).toBe('trace')
            expect(isDebugMode()).toBe(true)
        })

        it('invalid env var falls back to env default', async () => {
            vi.stubEnv('NODE_ENV', 'production')
            vi.stubEnv(LOG_LEVEL_KEY, 'banana')
            const { getLogLevel } = await importDebugMode()
            expect(getLogLevel()).toBe('error')
        })

        it('localStorage wins over env var', async () => {
            vi.stubEnv('NODE_ENV', 'production')
            vi.stubEnv(LOG_LEVEL_KEY, 'error')
            localStorage.setItem(LOG_LEVEL_KEY, 'debug')
            const { getLogLevel } = await importDebugMode()
            expect(getLogLevel()).toBe('debug')
        })
    })

    describe('module-load caching', () => {
        it('does not re-read localStorage on subsequent calls', async () => {
            vi.stubEnv('NODE_ENV', 'production')
            const { getLogLevel } = await importDebugMode()
            expect(getLogLevel()).toBe('error')

            localStorage.setItem(LOG_LEVEL_KEY, 'debug')

            expect(getLogLevel()).toBe('error')
        })
    })
})
