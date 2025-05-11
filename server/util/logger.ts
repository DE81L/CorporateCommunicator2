import pino from 'pino'
import pretty from 'pino-pretty'

const transport =
  process.env.NODE_ENV === 'production'
    ? undefined
    : pretty({ colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' })

export const logger = pino(transport)
export const log = logger.info.bind(logger)
