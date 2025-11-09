/**
 * Client-Side Logger Utility
 *
 * Centralized logging for the client application with different levels and structured output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

class ClientLogger {
  private readonly minLevel: LogLevel;
  private readonly isDevelopment: boolean;

  constructor() {
    // Detect environment
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    // Set log level from environment or default based on mode
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.minLevel = LogLevel[envLevel as keyof typeof LogLevel];
    } else {
      this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  /**
   * Format timestamp for logs
   */
  private timestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format log message with context
   */
  private format(level: string, message: string, context?: LogContext): string {
    const parts = [`[${this.timestamp()}]`, `[${level}]`, message];

    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context));
    }

    return parts.join(' ');
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(this.format('DEBUG', message, context));
    }
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    if (this.minLevel <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.log(this.format('INFO', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    if (this.minLevel <= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(this.format('WARN', message, context));
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.minLevel <= LogLevel.ERROR) {
      const errorContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };
      // eslint-disable-next-line no-console
      console.error(this.format('ERROR', message, errorContext));
    }
  }

  /**
   * Check if development mode is enabled
   */
  isDev(): boolean {
    return this.isDevelopment;
  }

  /**
   * Mask email address for privacy in logs
   * Example: test@example.com -> tes***@example.com
   */
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local && domain && local.length > 0) {
      const visibleChars = Math.min(3, local.length);
      return `${local.substring(0, visibleChars)}***@${domain}`;
    }
    return '***';
  }
}

// Export singleton instance
export const logger = new ClientLogger();
