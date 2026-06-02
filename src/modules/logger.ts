import log from 'loglevel'
import { getLogLevel } from './debug-mode'

log.setLevel(getLogLevel())

export const logger = log
