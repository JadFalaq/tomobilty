const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: !isProd
    ? {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    : undefined
});

module.exports = logger;
