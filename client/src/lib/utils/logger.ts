/**
 * Client-Side Logger Utility
 *
 * Centralized logging for the SvelteKit application with different levels and structured output
 * Writes logs to files on the server-side (SSR) for debugging and supports log rotation
 */

import { isDevelopment as envIsDevelopment } from './environment';
import { browser } from '$app/environment';
// Import Node.js modules conditionally (will be tree-shaken in browser builds)
import fs from 'node:fs';
import path from 'node:path';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
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

class ClientLogger {
	private readonly minLevel: LogLevel;
	private readonly isDevelopment: boolean;
	private readonly timers: Map<string, PerformanceTimer> = new Map();
	private readonly logToFile: boolean;
	private readonly logRetentionCount: number;
	private readonly logDir: string;
	private currentLogFile: string | null = null;
	private logStartTime: string | null = null;
	private readonly localStorageKey = 'uncharted_logs';
	private readonly localStorageErrorKey = 'uncharted_error_logs';

	constructor() {
		// Detect environment using centralized utility
		this.isDevelopment = envIsDevelopment;

		// Set log level from environment or default
		const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
		if (envLevel && envLevel in LogLevel) {
			this.minLevel = LogLevel[envLevel as keyof typeof LogLevel];
		} else {
			this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
		}

		// File logging configuration (only on server-side)
		this.logToFile = browser ? false : this.isDevelopment;
		this.logDir = browser ? '' : './logs';
		this.logRetentionCount = Number.parseInt(
			import.meta.env.VITE_LOG_RETENTION_COUNT || '5',
			10
		);

		// Initialize file logging (server-side only)
		if (this.logToFile && !browser) {
			this.initializeFileLogging();
		}

		// Initialize localStorage logging (browser only)
		if (browser) {
			this.initializeLocalStorageLogging();
		}
	}

	/**
	 * Initialize file logging system (server-side only)
	 */
	private initializeFileLogging(): void {
		try {
			// Create logs directory if it doesn't exist
			if (!fs.existsSync(this.logDir)) {
				fs.mkdirSync(this.logDir, { recursive: true });
			}

			// Rotate any existing .latest.log files
			this.rotateExistingLatestLogs();

			// Initialize new log file
			this.initializeLogFile();

			// Register shutdown handlers
			this.registerShutdownHandlers();
		} catch (err) {
			console.error('[LOGGER] Failed to initialize file logging:', err);
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

			// Clean up old logs
			this.cleanupOldLogs();
		} catch (err) {
			console.error('[LOGGER] Failed to rotate existing latest logs:', err);
		}
	}

	/**
	 * Clean up old log files, keeping only the configured number of most recent files
	 */
	private cleanupOldLogs(): void {
		try {
			// Clean up regular logs
			const regularLogs = fs
				.readdirSync(this.logDir)
				.filter((f) => f.endsWith('.log') && !f.endsWith('.latest.log') && !f.endsWith('.error.log'))
				.sort((a, b) => b.localeCompare(a)); // Most recent first

			if (regularLogs.length > this.logRetentionCount) {
				const filesToRemove = regularLogs.slice(this.logRetentionCount);
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

			// Clean up error logs
			const errorLogs = fs
				.readdirSync(this.logDir)
				.filter((f) => f.endsWith('.error.log'))
				.sort((a, b) => b.localeCompare(a)); // Most recent first

			if (errorLogs.length > this.logRetentionCount) {
				const filesToRemove = errorLogs.slice(this.logRetentionCount);
				console.log(`[LOGGER] Cleaning up ${filesToRemove.length} old error log file(s)...`);

				for (const file of filesToRemove) {
					try {
						fs.unlinkSync(path.join(this.logDir, file));
						console.log(`[LOGGER] Deleted old error log: ${file}`);
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
	 * Initialize localStorage logging for browser
	 */
	private initializeLocalStorageLogging(): void {
		if (!browser) return;

		try {
			// Clean up old logs on initialization
			this.cleanupLocalStorageLogs();

			// Initialize current session
			const now = new Date();
			const date = now.toISOString().split('T')[0];
			const time = now.toISOString().split('T')[1].replaceAll(':', '-').split('.')[0];
			this.logStartTime = `${date}-${time}`;

			console.log(`[LOGGER] Browser logging to localStorage initialized`);
		} catch (err) {
			console.error('[LOGGER] Failed to initialize localStorage logging:', err);
		}
	}

	/**
	 * Clean up old localStorage logs, keeping only the most recent entries
	 */
	private cleanupLocalStorageLogs(): void {
		if (!browser) return;

		try {
			// Get all log entries
			const regularLogs = this.getLocalStorageLogs();
			const errorLogs = this.getLocalStorageErrorLogs();

			// Keep only retention count of each type
			if (regularLogs.length > this.logRetentionCount) {
				const toKeep = regularLogs.slice(-this.logRetentionCount);
				localStorage.setItem(this.localStorageKey, JSON.stringify(toKeep));
				console.log(
					`[LOGGER] Cleaned up ${regularLogs.length - toKeep.length} old browser log entries`
				);
			}

			if (errorLogs.length > this.logRetentionCount) {
				const toKeep = errorLogs.slice(-this.logRetentionCount);
				localStorage.setItem(this.localStorageErrorKey, JSON.stringify(toKeep));
				console.log(
					`[LOGGER] Cleaned up ${errorLogs.length - toKeep.length} old browser error log entries`
				);
			}
		} catch (err) {
			console.error('[LOGGER] Failed to cleanup localStorage logs:', err);
		}
	}

	/**
	 * Get logs from localStorage
	 */
	private getLocalStorageLogs(): string[] {
		if (!browser) return [];
		try {
			const logs = localStorage.getItem(this.localStorageKey);
			return logs ? JSON.parse(logs) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Get error logs from localStorage
	 */
	private getLocalStorageErrorLogs(): string[] {
		if (!browser) return [];
		try {
			const logs = localStorage.getItem(this.localStorageErrorKey);
			return logs ? JSON.parse(logs) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Write log to localStorage (browser only)
	 */
	private writeToLocalStorage(level: string, message: string, context?: LogContext): void {
		if (!browser) return;

		try {
			const timestamp = this.timestamp();
			const logEntry = `[${timestamp}] [${level.padEnd(5)}] ${message}${
				context ? ' ' + JSON.stringify(context) : ''
			}`;

			// Add to regular logs
			const regularLogs = this.getLocalStorageLogs();
			regularLogs.push(logEntry);

			// Keep only the most recent entries (avoid localStorage quota)
			const maxEntries = 1000; // Keep max 1000 entries before cleanup
			if (regularLogs.length > maxEntries) {
				regularLogs.splice(0, regularLogs.length - maxEntries);
			}

			localStorage.setItem(this.localStorageKey, JSON.stringify(regularLogs));

			// Also add errors to separate error log
			if (level === 'ERROR') {
				const errorLogs = this.getLocalStorageErrorLogs();
				errorLogs.push(logEntry);

				if (errorLogs.length > maxEntries) {
					errorLogs.splice(0, errorLogs.length - maxEntries);
				}

				localStorage.setItem(this.localStorageErrorKey, JSON.stringify(errorLogs));
			}
		} catch (err) {
			// Don't crash if localStorage is full or unavailable
			console.error('[LOGGER] Failed to write to localStorage:', err);
		}
	}

	/**
	 * Register handlers to rename .latest.log on shutdown
	 */
	private registerShutdownHandlers(): void {
		if (browser) return;

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
	 * Get styled console method based on level
	 */
	private getConsoleStyle(level: string): string[] {
		if (!browser) {
			// No colors in server logs
			return ['', ''];
		}

		const styles: Record<string, string[]> = {
			DEBUG: ['color: #00bcd4; font-weight: bold', 'color: #666'],
			INFO: ['color: #4caf50; font-weight: bold', 'color: #333'],
			WARN: ['color: #ff9800; font-weight: bold', 'color: #333'],
			ERROR: ['color: #f44336; font-weight: bold', 'color: #333']
		};
		return styles[level] || styles.INFO;
	}

	/**
	 * Format log message with context
	 */
	private format(
		level: string,
		message: string,
		context?: LogContext
	): [string, string, string, string?] {
		const timestamp = this.timestamp();
		const [levelStyle, msgStyle] = this.getConsoleStyle(level);

		// Build context string for inline display
		let contextStr: string | undefined;
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

		return [`[${timestamp}] [${level}] ${message}${contextStr || ''}`, levelStyle, msgStyle];
	}

	/**
	 * Write log to file (server-side only)
	 */
	private writeToFile(level: string, message: string, context?: LogContext): void {
		if (browser) {
			// Write to localStorage in browser
			this.writeToLocalStorage(level, message, context);
			return;
		}

		if (!this.logToFile || !this.currentLogFile) return;

		try {
			const timestamp = this.timestamp();

			// Write to the current .latest.log file
			const logEntry = `[${timestamp}] [${level.padEnd(5)}] ${message}${
				context ? ' ' + JSON.stringify(context) : ''
			}\n`;

			fs.appendFileSync(this.currentLogFile, logEntry, 'utf8');

			// Also write errors to separate timestamped error log
			if (level === 'ERROR' && this.logStartTime) {
				const errorFile = path.join(this.logDir, `${this.logStartTime}.error.log`);
				fs.appendFileSync(errorFile, logEntry, 'utf8');
			}
		} catch (err) {
			// Don't crash if file writing fails
			console.error('[LOGGER] Failed to write log to file:', err);
		}
	}

	/**
	 * Log debug messages (verbose, for development)
	 */
	debug(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.DEBUG) {
			const [msg, ...args] = this.format('DEBUG', message, context);
			console.debug(msg, ...args.filter(Boolean));
			this.writeToFile('DEBUG', message, context);
		}
	}

	/**
	 * Log info messages (normal operations)
	 */
	info(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.INFO) {
			const [msg, ...args] = this.format('INFO', message, context);
			console.log(msg, ...args.filter(Boolean));
			this.writeToFile('INFO', message, context);
		}
	}

	/**
	 * Log warning messages (potential issues)
	 */
	warn(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.WARN) {
			const [msg, ...args] = this.format('WARN', message, context);
			console.warn(msg, ...args.filter(Boolean));
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
					stack: this.isDevelopment
						? error.stack?.split('\n').slice(0, 5).join('\n')
						: undefined
				};
			} else if (error) {
				errorContext.error = error;
			}

			const [msg, ...args] = this.format('ERROR', message, errorContext);
			console.error(msg, ...args.filter(Boolean));
			this.writeToFile('ERROR', message, errorContext);
		}
	}

	/**
	 * Start a log group
	 */
	group(label: string): void {
		console.group(`📦 ${label}`);
	}

	/**
	 * Start a collapsed log group
	 */
	groupCollapsed(label: string): void {
		console.groupCollapsed(`📦 ${label}`);
	}

	/**
	 * End a log group
	 */
	groupEnd(): void {
		console.groupEnd();
	}

	/**
	 * Log API request
	 */
	apiRequest(method: string, url: string, context?: LogContext): void {
		this.debug(`➜ ${method} ${url}`, context);
	}

	/**
	 * Log API response
	 */
	apiResponse(
		method: string,
		url: string,
		status: number,
		duration?: number,
		context?: LogContext
	): void {
		let emoji: string;
		if (status >= 500) {
			emoji = '❌';
		} else if (status >= 400) {
			emoji = '⚠️';
		} else {
			emoji = '✓';
		}
		const level = status >= 400 ? 'warn' : 'debug';
		this[level](`${emoji} ${method} ${url}`, {
			...context,
			status,
			...(duration === undefined ? {} : { duration })
		});
	}

	/**
	 * Log component lifecycle
	 */
	component(name: string, event: 'mount' | 'unmount' | 'update', context?: LogContext): void {
		this.debug(`🧩 ${name} ${event}`, context);
	}

	/**
	 * Log navigation
	 */
	navigation(from: string, to: string): void {
		this.debug(`🧭 Navigation: ${from} → ${to}`);
	}

	/**
	 * Performance timing
	 */
	startTimer(label: string): void {
		if (this.minLevel <= LogLevel.DEBUG && typeof performance !== 'undefined') {
			performance.mark(`${label}-start`);
		}
	}

	/**
	 * End performance timer
	 */
	endTimer(label: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.DEBUG && typeof performance !== 'undefined') {
			try {
				performance.mark(`${label}-end`);
				performance.measure(label, `${label}-start`, `${label}-end`);
				const measure = performance.getEntriesByName(label)[0];
				this.debug(`⏱️ ${label}`, {
					...context,
					duration: Number.parseFloat(measure.duration.toFixed(2))
				});
				performance.clearMarks(`${label}-start`);
				performance.clearMarks(`${label}-end`);
				performance.clearMeasures(label);
			} catch {
				// Ignore timing errors
			}
		}
	} /**
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

	/**
	 * Enable debug mode (useful for production debugging)
	 */
	static enableDebug(): void {
		localStorage.setItem('LOG_LEVEL', 'DEBUG');
		console.log('🔧 Debug logging enabled. Reload the page to see debug logs.');
	}

	/**
	 * Disable debug mode
	 */
	static disableDebug(): void {
		localStorage.removeItem('LOG_LEVEL');
		console.log('🔧 Debug logging disabled. Reload the page.');
	}

	/**
	 * Export logs as text (browser only)
	 */
	exportLogs(): string {
		if (!browser) return 'Not available on server';
		const logs = this.getLocalStorageLogs();
		return logs.join('\n');
	}

	/**
	 * Export error logs as text (browser only)
	 */
	exportErrorLogs(): string {
		if (!browser) return 'Not available on server';
		const logs = this.getLocalStorageErrorLogs();
		return logs.join('\n');
	}

	/**
	 * Clear all logs from localStorage (browser only)
	 */
	clearLogs(): void {
		if (!browser) return;
		localStorage.removeItem(this.localStorageKey);
		localStorage.removeItem(this.localStorageErrorKey);
		console.log('🗑️ Browser logs cleared');
	}
}

// Export singleton instance
export const logger = new ClientLogger();

// Make debug controls available globally in browser
if (globalThis.window !== undefined) {
	(globalThis as unknown as Record<string, unknown>).enableDebugLogs = ClientLogger.enableDebug;
	(globalThis as unknown as Record<string, unknown>).disableDebugLogs = ClientLogger.disableDebug;
	(globalThis as unknown as Record<string, unknown>).exportLogs = () => logger.exportLogs();
	(globalThis as unknown as Record<string, unknown>).exportErrorLogs = () =>
		logger.exportErrorLogs();
	(globalThis as unknown as Record<string, unknown>).clearLogs = () => logger.clearLogs();

	// Log current log level on load (development only)
	if (logger.isDev()) {
		console.log(
			'🔧 Logger initialized. Use enableDebugLogs() or disableDebugLogs() to control logging.'
		);
		console.log(
			'📋 Use exportLogs() or exportErrorLogs() to download logs. Use clearLogs() to clear them.'
		);
	}
}
