import { type LogLevelNames } from 'loglevel'

const LOG_LEVEL_KEY = 'EVENT_VISUALIZER_LOG_LEVEL'

export type LogLevel = LogLevelNames | 'silent'

const LOG_LEVELS: readonly LogLevel[] = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'silent',
]

const DEBUG_LEVELS: ReadonlySet<LogLevel> = new Set(['trace', 'debug', 'info'])

const isLogLevel = (value: unknown): value is LogLevel =>
    typeof value === 'string' &&
    (LOG_LEVELS as readonly string[]).includes(value)

const readLocalStorageOverride = (): LogLevel | null => {
    try {
        const raw = window.localStorage?.getItem(LOG_LEVEL_KEY)
        return isLogLevel(raw) ? raw : null
    } catch {
        return null
    }
}

const readEnvOverride = (): LogLevel | null => {
    if (typeof process === 'undefined' || !process.env) {
        return null
    }
    const value = process.env[LOG_LEVEL_KEY]
    return isLogLevel(value) ? value : null
}

const computeLogLevel = (): LogLevel => {
    const localStorageOverride = readLocalStorageOverride()
    if (localStorageOverride) {
        return localStorageOverride
    }
    const envOverride = readEnvOverride()
    if (envOverride) {
        return envOverride
    }
    return process.env.NODE_ENV === 'development' ? 'info' : 'error'
}

const level: LogLevel = computeLogLevel()

export const getLogLevel = (): LogLevel => level

export const isDebugMode = (): boolean => DEBUG_LEVELS.has(level)
