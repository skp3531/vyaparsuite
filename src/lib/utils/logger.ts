export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  tenantId?: string;
  companyId?: string;
  userId?: string;
  requestId?: string;
  module?: string;
  doctype?: string;
  documentId?: string;
  action?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    if (shouldLog('debug')) console.debug(formatLog('debug', message, context));
  },
  info(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    if (shouldLog('info')) console.info(formatLog('info', message, context));
  },
  warn(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    if (shouldLog('warn')) console.warn(formatLog('warn', message, context));
  },
  error(message: string, error?: Error, context?: LogContext) {
    // eslint-disable-next-line no-console
    if (shouldLog('error')) console.error(formatLog('error', message, context, error));
  },
  fatal(message: string, error?: Error, context?: LogContext) {
    // eslint-disable-next-line no-console
    if (shouldLog('fatal')) console.error(formatLog('fatal', message, context, error));
  },
};
