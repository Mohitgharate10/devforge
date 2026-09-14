export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, boolean | number | string | undefined>;

export type Logger = {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
};

const logLevelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const environmentLogLevel = (process.env.LOG_LEVEL ?? 'info') as LogLevel;
const minimumLevel = logLevelPriority[environmentLogLevel] ?? logLevelPriority.info;

function write(level: LogLevel, message: string, context: LogContext = {}): void {
  if (logLevelPriority[level] < minimumLevel) {
    return;
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'web',
    message,
    ...context,
  });

  if (level === 'error') {
    console.error(entry);
    return;
  }

  console.log(entry);
}

export const logger: Logger = {
  debug: (message, context) => write('debug', message, context),
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
};
