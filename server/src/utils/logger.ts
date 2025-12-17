/**
 * Logger Utility
 *
 * Centralized logging with different levels, structured output, and request tracing
 * Integrates with Sentry for error tracking
 * Writes logs to files for debugging
 */

import fs from 'fs';
import path from 'path';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

interface LogContext {
	[key: string]: unknown;
	requestId?: string;
	userId?: string;
	duration?: number;
	statusCode?: number;
}

interface PerformanceTimer {
	start: number;
	label: string;
}

class Logger {
	private readonly minLevel: LogLevel;
	private readonly timers: Map<string, PerformanceTimer> = new Map();
	private readonly isProd: boolean;
	private readonly logDir: string;
	private readonly logToFile: boolean;
	private currentLogFile: string | null = null;
	private logStartTime: string | null = null;

	constructor() {
		// Set log level from environment or default to INFO
		const envLevel = process.env.LOG_LEVEL?.toUpperCase();
		this.minLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
		this.isProd = process.env.NODE_ENV === 'production';

		// File logging configuration
		this.logToFile = process.env.LOG_TO_FILE === 'true' || !this.isProd; // Always log to file in dev
		this.logDir = path.join(process.cwd(), 'logs');

		// Create logs directory if it doesn't exist
		if (this.logToFile && !fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}

		// Rename any existing .latest.log files from previous runs
		if (this.logToFile) {
			this.rotateExistingLatestLogs();
		}

		// Clean up old log files (keep only 10 most recent)
		if (this.logToFile) {
			this.cleanupOldLogs();
		}

		// Initialize new log file
		if (this.logToFile) {
			this.initializeLogFile();
		}

		// Register shutdown handlers to rename .latest.log on exit
		if (this.logToFile) {
			this.registerShutdownHandlers();
		}
	}

	/**
	 * Rotate any existing .latest.log files from previous runs
	 */
	private rotateExistingLatestLogs(): void {
		try {
			const files = fs.readdirSync(this.logDir);
			const latestLogFiles = files.filter((f) => f.endsWith('.latest.log'));

			for (const file of latestLogFiles) {
				const oldPath = path.join(this.logDir, file);
				const newPath = path.join(this.logDir, file.replace('.latest.log', '.log'));

				try {
					fs.renameSync(oldPath, newPath);
					console.log(
						`[LOGGER] Rotated previous log: ${file} → ${path.basename(newPath)}`
					);
				} catch (err) {
					console.error(`[LOGGER] Failed to rotate ${file}:`, err);
				}
			}
		} catch (err) {
			console.error('[LOGGER] Failed to rotate existing latest logs:', err);
		}
	}

	/**
	 * Clean up old log files, keeping only the 10 most recent
	 */
	private cleanupOldLogs(): void {
		try {
			const MAX_LOG_FILES = 10;
			const files = fs
				.readdirSync(this.logDir)
				.filter((f) => f.endsWith('.log') && !f.endsWith('.latest.log'))
				.sort((a, b) => b.localeCompare(a)); // Most recent first

			// Remove old files beyond the limit
			if (files.length > MAX_LOG_FILES) {
				const filesToRemove = files.slice(MAX_LOG_FILES);
				console.log(`[LOGGER] Cleaning up ${filesToRemove.length} old log file(s)...`);

				for (const file of filesToRemove) {
					try {
						fs.unlinkSync(path.join(this.logDir, file));
						console.log(`[LOGGER] Deleted old log: ${file}`);
					} catch (err) {
						console.error(`[LOGGER] Failed to delete ${file}:`, err);
					}
				}
			}
		} catch (err) {
			console.error('[LOGGER] Failed to cleanup old logs:', err);
		}
	}

	/**
	 * Initialize new timestamped .latest.log file
	 */
	private initializeLogFile(): void {
		const now = new Date();
		const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const time = now.toISOString().split('T')[1].replaceAll(':', '-').split('.')[0]; // HH-MM-SS
		this.logStartTime = `${date}-${time}`;
		this.currentLogFile = path.join(this.logDir, `${this.logStartTime}.latest.log`);

		console.log(`[LOGGER] Started new log file: ${path.basename(this.currentLogFile)}`);
	}

	/**
	 * Register handlers to rename .latest.log on shutdown
	 */
	private registerShutdownHandlers(): void {
		const renameLatestLog = () => {
			if (this.currentLogFile && fs.existsSync(this.currentLogFile)) {
				const finalPath = this.currentLogFile.replace('.latest.log', '.log');
				try {
					fs.renameSync(this.currentLogFile, finalPath);
					console.log(`[LOGGER] Finalized log: ${path.basename(finalPath)}`);
				} catch (err) {
					console.error('[LOGGER] Failed to rename .latest.log on shutdown:', err);
				}
			}
		};

		// Handle various shutdown signals
		process.on('SIGINT', () => {
			renameLatestLog();
			process.exit(0);
		});

		process.on('SIGTERM', () => {
			renameLatestLog();
			process.exit(0);
		});

		process.on('exit', () => {
			renameLatestLog();
		});

		// Handle uncaught exceptions
		process.on('uncaughtException', (err) => {
			console.error('[LOGGER] Uncaught exception:', err);
			renameLatestLog();
			process.exit(1);
		});
	}

	/**
	 * Format timestamp for logs
	 */
	private timestamp(): string {
		return new Date().toISOString();
	}

	/**
	 * Color codes for console output (disabled in production)
	 */
	private colorize(level: string, text: string): string {
		if (this.isProd) return text;

		const colors = {
			DEBUG: '\x1b[36m', // Cyan
			INFO: '\x1b[32m', // Green
			WARN: '\x1b[33m', // Yellow
			ERROR: '\x1b[31m', // Red
			RESET: '\x1b[0m',
		};

		const color = colors[level as keyof typeof colors] || colors.RESET;
		return `${color}${text}${colors.RESET}`;
	}

	/**
	 * Format log message with context
	 */
	private format(level: string, message: string, context?: LogContext): string {
		const timestamp = this.timestamp();
		const coloredLevel = this.colorize(level, level.padEnd(5));

		// Build context string
		let contextStr = '';
		if (context && Object.keys(context).length > 0) {
			// Extract special fields for inline display
			const { requestId, userId, duration, statusCode, ...rest } = context;

			const inline: string[] = [];
			if (requestId) inline.push(`req=${requestId}`);
			if (userId) inline.push(`user=${userId}`);
			if (statusCode) inline.push(`status=${statusCode}`);
			if (duration !== undefined) inline.push(`${duration}ms`);

			const inlineStr = inline.length > 0 ? ` [${inline.join(' ')}]` : '';

			// Add remaining context as JSON if present
			const hasRest = Object.keys(rest).length > 0;
			contextStr = inlineStr + (hasRest ? ` ${JSON.stringify(rest)}` : '');
		}

		return `[${timestamp}] [${coloredLevel}] ${message}${contextStr}`;
	}

	/**
	 * Write log to file
	 */
	private writeToFile(level: string, message: string, context?: LogContext): void {
		if (!this.logToFile || !this.currentLogFile) return;

		try {
			const timestamp = this.timestamp();

			// Write to the current .latest.log file
			const logEntry = `[${timestamp}] [${level.padEnd(5)}] ${message}${
				context ? ' ' + JSON.stringify(context) : ''
			}\n`;

			fs.appendFileSync(this.currentLogFile, logEntry, 'utf8');

			// Also write errors to separate timestamped error log
			if (level === 'ERROR') {
				const errorFile = path.join(this.logDir, `${this.logStartTime}.error.log`);
				fs.appendFileSync(errorFile, logEntry, 'utf8');
			}
		} catch (err) {
			// Don't crash if file writing fails
			console.error('Failed to write log to file:', err);
		}
	} /**
	 * Log debug messages (verbose, for development)
	 */
	debug(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.DEBUG) {
			console.debug(this.format('DEBUG', message, context));
			this.writeToFile('DEBUG', message, context);
		}
	}

	/**
	 * Log info messages (normal operations)
	 */
	info(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.INFO) {
			console.log(this.format('INFO', message, context));
			this.writeToFile('INFO', message, context);
		}
	}

	/**
	 * Log warning messages (potential issues)
	 */
	warn(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.WARN) {
			console.warn(this.format('WARN', message, context));
			this.writeToFile('WARN', message, context);
		}
	}

	/**
	 * Log error messages with stack traces
	 */
	error(message: string, error?: unknown, context?: LogContext): void {
		if (this.minLevel <= LogLevel.ERROR) {
			const errorContext: LogContext = { ...context };

			if (error instanceof Error) {
				errorContext.error = {
					name: error.name,
					message: error.message,
					stack: this.isProd
						? undefined
						: error.stack?.split('\n').slice(0, 5).join('\n'),
				};
			} else if (error) {
				errorContext.error = error;
			}

			console.error(this.format('ERROR', message, errorContext));
			this.writeToFile('ERROR', message, errorContext);

			// Send to Sentry in production or if explicitly enabled
			if (this.isProd) {
				try {
					const { captureException, addBreadcrumb } = require('./sentry.js');

					// Add breadcrumb for context
					addBreadcrumb(message, 'error', context);

					// Capture exception
					if (error instanceof Error) {
						captureException(error, context);
					} else if (error) {
						captureException(new Error(message), { ...context, originalError: error });
					}
				} catch {
					// Ignore sentry errors to prevent logging infinite loops
				}
			}
		}
	} /**
	 * Start a performance timer
	 */
	startTimer(label: string): void {
		this.timers.set(label, { start: Date.now(), label });
	}

	/**
	 * End a performance timer and log duration
	 */
	endTimer(label: string, context?: LogContext): number {
		const timer = this.timers.get(label);
		if (!timer) {
			this.warn(`Timer "${label}" not found`);
			return 0;
		}

		const duration = Date.now() - timer.start;
		this.timers.delete(label);

		this.info(`⏱️ ${label}`, { ...context, duration });
		return duration;
	}

	/**
	 * Log HTTP request
	 */
	httpRequest(method: string, path: string, context?: LogContext): void {
		this.info(`➜ ${method} ${path}`, context);
	}

	/**
	 * Log HTTP response
	 */
	httpResponse(
		method: string,
		path: string,
		statusCode: number,
		duration: number,
		context?: LogContext
	): void {
		let emoji: string;
		if (statusCode >= 500) {
			emoji = '❌';
		} else if (statusCode >= 400) {
			emoji = '⚠️';
		} else {
			emoji = '✓';
		}
		this.info(`${emoji} ${method} ${path}`, { ...context, statusCode, duration });
	}

	/**
	 * Log database operation
	 */
	dbQuery(operation: string, table: string, context?: LogContext): void {
		this.debug(`🗄️ DB ${operation} ${table}`, context);
	}

	/**
	 * Log WebSocket event
	 */
	wsEvent(event: string, context?: LogContext): void {
		this.debug(`🔌 WS ${event}`, context);
	}

	/**
	 * Log authentication event
	 */
	authEvent(event: string, success: boolean, context?: LogContext): void {
		const emoji = success ? '🔓' : '🔒';
		const level = success ? 'info' : 'warn';
		this[level](`${emoji} AUTH ${event}`, context);
	}

	/**
	 * Create a child logger with default context (e.g., requestId)
	 */
	child(defaultContext: LogContext): ChildLogger {
		return new ChildLogger(this, defaultContext);
	}
}

/**
 * Child logger that includes default context in all logs
 */
class ChildLogger {
	constructor(
		private parent: Logger,
		private defaultContext: LogContext
	) {}

	private mergeContext(context?: LogContext): LogContext {
		return { ...this.defaultContext, ...context };
	}

	debug(message: string, context?: LogContext): void {
		this.parent.debug(message, this.mergeContext(context));
	}

	info(message: string, context?: LogContext): void {
		this.parent.info(message, this.mergeContext(context));
	}

	warn(message: string, context?: LogContext): void {
		this.parent.warn(message, this.mergeContext(context));
	}

	error(message: string, error?: unknown, context?: LogContext): void {
		this.parent.error(message, error, this.mergeContext(context));
	}

	startTimer(label: string): void {
		this.parent.startTimer(label);
	}

	endTimer(label: string, context?: LogContext): number {
		return this.parent.endTimer(label, this.mergeContext(context));
	}

	httpRequest(method: string, path: string, context?: LogContext): void {
		this.parent.httpRequest(method, path, this.mergeContext(context));
	}

	httpResponse(
		method: string,
		path: string,
		statusCode: number,
		duration: number,
		context?: LogContext
	): void {
		this.parent.httpResponse(method, path, statusCode, duration, this.mergeContext(context));
	}
}

// Export singleton instance
export const logger = new Logger();
