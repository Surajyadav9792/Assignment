import winston from 'winston';

const fmt = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fmt,
  transports: [new winston.transports.Console()],
});
