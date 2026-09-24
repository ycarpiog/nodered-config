const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

class LoggerFactory {
  static loggers = {};
  static LOGS_FOLDER = path.join(__dirname, '../logs'); // equivalente a s.LOGS_FOLDER
  static LOG_LEVEL = 'info';

  static ensureLogDir(taskName) {
    const dir = path.join(this.LOGS_FOLDER, taskName);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static getLogger(taskName, logToFile = true, logLevel = null) {
    if (this.loggers[taskName]) return this.loggers[taskName];
    const level = logLevel || this.LOG_LEVEL;

    const logTransports = [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      })
    ];

    if (logToFile) {
      const dir = this.ensureLogDir(taskName);
      logTransports.push(
        new transports.DailyRotateFile({
          filename: path.join(dir, `${taskName}-%DATE%.log`),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxFiles: '30d',
          level: level,
          format: format.combine(
            format.timestamp(),
            format.printf(({ timestamp, level, message }) =>
              `${timestamp} - ${taskName} - ${level.toUpperCase()} - ${message}`
            )
          )
        })
      );
    }

    const logger = createLogger({
      level: level,
      transports: logTransports
    });

    this.loggers[taskName] = logger;
    return logger;
  }
}

module.exports = LoggerFactory;
