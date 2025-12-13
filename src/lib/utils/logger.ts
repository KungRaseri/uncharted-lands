/**
 * Client-Side Logger Utility
 *
 * Centralized logging for the client application with different levels and structured output
 */

import { isDevelopment as envIsDevelopment } from './environment';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

interface LogContext {
	[key: string]: unknown;
}

class ClientLogger {
	private readonly minLevel: LogLevel;
	private readonly isDevelopment: boolean;

	constructor() {
		// Detect environment using centralized utility
		this.isDevelopment = envIsDevelopment;

		// Allow override via localStorage for production debugging
		const storedLevel =
			typeof window !== 'undefined' ? localStorage.getItem('LOG_LEVEL')?.toUpperCase() : null;

		// Set log level from localStorage, environment, or default
		const envLevel = storedLevel || import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
		if (envLevel && envLevel in LogLevel) {
			this.minLevel = LogLevel[envLevel as keyof typeof LogLevel];
		} else {
			this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
		}
	}

	/**
	 * Format timestamp for logs
	 */
	private timestamp(): string {
		return new Date().toISOString().split('T')[1].replace('Z', '');
	}

	/**
	 * Get styled console method based on level
	 */
	private getConsoleStyle(level: string): string[] {
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

		// Build context string
		let contextStr: string | undefined;
		if (context && Object.keys(context).length > 0) {
			contextStr = JSON.stringify(context, null, this.isDevelopment ? 2 : 0);
		}

		return [`%c[${timestamp}] [${level}]%c ${message}`, levelStyle, msgStyle, contextStr];
	}

	/**
	 * Log debug messages (verbose, for development)
	 */
	debug(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.DEBUG) {
			const [msg, ...args] = this.format('DEBUG', message, context);
			console.debug(msg, ...args.filter(Boolean));
		}
	}

	/**
	 * Log info messages
	 */
	info(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.INFO) {
			const [msg, ...args] = this.format('INFO', message, context);
			console.log(msg, ...args.filter(Boolean));
		}
	}

	/**
	 * Log warning messages
	 */
	warn(message: string, context?: LogContext): void {
		if (this.minLevel <= LogLevel.WARN) {
			const [msg, ...args] = this.format('WARN', message, context);
			console.warn(msg, ...args.filter(Boolean));
		}
	}

	/**
	 * Log error messages
	 */
	error(message: string, error?: unknown, context?: LogContext): void {
		if (this.minLevel <= LogLevel.ERROR) {
			const errorContext: LogContext = { ...context };
			if (error instanceof Error) {
				errorContext.error = {
					name: error.name,
					message: error.message,
					stack: this.isDevelopment ? error.stack : undefined
				};
			} else if (error) {
				errorContext.error = error;
			}

			const [msg, ...args] = this.format('ERROR', message, errorContext);
			console.error(msg, ...args.filter(Boolean));
		}
	}

	/**
	 * Group related log messages
	 */
	group(label: string, collapsed = false): void {
		if (collapsed) {
			console.groupCollapsed(`📦 ${label}`);
		} else {
			console.group(`📦 ${label}`);
		}
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
		const emoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✓';
		const level = status >= 400 ? 'warn' : 'debug';
		this[level](`${emoji} ${method} ${url}`, {
			...context,
			status,
			...(duration ? { duration: `${duration}ms` } : {})
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
					duration: `${measure.duration.toFixed(2)}ms`
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
}

// Export singleton instance
export const logger = new ClientLogger();

// Make debug controls available globally in browser
if (typeof window !== 'undefined') {
	(window as unknown as Record<string, unknown>).enableDebugLogs = ClientLogger.enableDebug;
	(window as unknown as Record<string, unknown>).disableDebugLogs = ClientLogger.disableDebug;

	// Log current log level on load (development only)
	if (logger.isDev()) {
		console.log(
			'🔧 Logger initialized. Use enableDebugLogs() or disableDebugLogs() to control logging.'
		);
	}
}
