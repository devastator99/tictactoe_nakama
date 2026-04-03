/**
 * Simple structured logger for React Native
 * Provides consistent logging across mobile app
 * 
 * Usage:
 *   Log.info('auth', { userId: '123' }, 'User authenticated')
 *   Log.error('network', { code: 500 }, 'Request failed')
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogModule = 
  | 'auth'
  | 'nakama'
  | 'network'
  | 'ui'
  | 'storage'
  | 'game'
  | 'performance'
  | 'other'

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Control log level here (debug/info/warn/error)
const ACTIVE_LOG_LEVEL: LogLevel = __DEV__ ? 'debug' : 'info'

const colorize = (level: LogLevel, text: string): string => {
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m',  // cyan
    info: '\x1b[32m',   // green
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
  }
  const reset = '\x1b[0m'
  return `${colors[level]}${text}${reset}`
}

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[ACTIVE_LOG_LEVEL]
}

const formatTimestamp = (): string => {
  return new Date().toISOString()
}

const formatLog = (
  level: LogLevel,
  module: LogModule,
  data: Record<string, any> | null,
  message: string
): string => {
  const timestamp = formatTimestamp()
  const dataStr = data ? JSON.stringify(data) : ''
  return `[${timestamp}] ${level.toUpperCase()} [${module}] ${message} ${dataStr}`
}

export const Log = {
  debug: (module: LogModule, data: Record<string, any> | null, message: string) => {
    if (shouldLog('debug')) {
      const formatted = formatLog('debug', module, data, message)
      console.debug(colorize('debug', formatted))
    }
  },

  info: (module: LogModule, data: Record<string, any> | null, message: string) => {
    if (shouldLog('info')) {
      const formatted = formatLog('info', module, data, message)
      console.log(colorize('info', formatted))
    }
  },

  warn: (module: LogModule, data: Record<string, any> | null, message: string) => {
    if (shouldLog('warn')) {
      const formatted = formatLog('warn', module, data, message)
      console.warn(colorize('warn', formatted))
    }
  },

  error: (module: LogModule, data: Record<string, any> | null, message: string) => {
    if (shouldLog('error')) {
      const formatted = formatLog('error', module, data, message)
      console.error(colorize('error', formatted))
    }
  },
}
