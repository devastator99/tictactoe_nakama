import pino from 'pino'

const baseLogger = pino({
  level: import.meta.env.DEV ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
})

export const logger = baseLogger.child({ app: 'lila-frontend' })
