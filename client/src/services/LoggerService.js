/**
 * SINGLETON PATTERN - Logger Service
 * 
 * Single instance of logger service used throughout the application.
 * Demonstrates Singleton pattern by ensuring only one logger exists.
 */

class LoggerService {
  static instance = null;
  
  constructor() {
    if (LoggerService.instance) {
      return LoggerService.instance;
    }
    this.logs = [];
    this.maxLogs = 100;
    LoggerService.instance = this;
  }

  static getInstance() {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      data,
    };
  }

  _addLog(logEntry) {
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  info(message, data = null) {
    const logEntry = this._formatMessage('INFO', message, data);
    this._addLog(logEntry);
    console.log(`ℹ️ [${logEntry.timestamp}] ${message}`, data || '');
    return logEntry;
  }

  warn(message, data = null) {
    const logEntry = this._formatMessage('WARN', message, data);
    this._addLog(logEntry);
    console.warn(`⚠️ [${logEntry.timestamp}] ${message}`, data || '');
    return logEntry;
  }

  error(message, data = null) {
    const logEntry = this._formatMessage('ERROR', message, data);
    this._addLog(logEntry);
    console.error(`❌ [${logEntry.timestamp}] ${message}`, data || '');
    return logEntry;
  }

  debug(message, data = null) {
    const logEntry = this._formatMessage('DEBUG', message, data);
    this._addLog(logEntry);
    console.log(`🔍 [${logEntry.timestamp}] ${message}`, data || '');
    return logEntry;
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Export singleton instance
const logger = LoggerService.getInstance();
export default logger;
export { LoggerService };
