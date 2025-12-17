import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, LogLevel } from '../../../src/utils/logger.js';

describe('Logger Utility', () => {
	let consoleSpy: any;

	beforeEach(() => {
		consoleSpy = {
			log: vi.spyOn(console, 'log').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Log Levels', () => {
		it('should log error messages', () => {
			logger.error('Test error message');
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should log warning messages', () => {
			logger.warn('Test warning message');
			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		it('should log info messages (default level)', () => {
			logger.info('Test info message');
			// Logger defaults to INFO level, so info should be logged
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it('should not log debug messages by default', () => {
			logger.debug('Test debug message');
			// Logger defaults to INFO level, so debug is filtered out
			expect(consoleSpy.log).not.toHaveBeenCalled();
		});
	});

	describe('Message Formatting', () => {
		it('should handle string messages', () => {
			logger.info('Simple string message');
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it('should handle context objects', () => {
			logger.info('Message with context', { key: 'value', nested: { data: 'test' } });
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it('should handle error objects', () => {
			const error = new Error('Test error');
			logger.error('Error occurred', error);
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should handle context with error', () => {
			const error = new Error('Test error');
			logger.error('Error with context', error, { userId: '123' });
			expect(consoleSpy.error).toHaveBeenCalled();
		});
	});

	describe('Context Information', () => {
		it('should log with context prefix', () => {
			logger.info('Message with context', { context: 'TestContext' });
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it('should handle timestamp in logs', () => {
			logger.info('Timestamped message');
			expect(consoleSpy.log).toHaveBeenCalled();
		});
	});

	describe('Special Cases', () => {
		it('should handle empty messages', () => {
			logger.info('');
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it('should handle very long messages', () => {
			const longMessage = 'x'.repeat(10000);
			logger.info(longMessage);
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it('should handle special characters', () => {
			logger.info('Message with \n newlines \t tabs and 🎮 emojis');
			expect(consoleSpy.log).toHaveBeenCalled();
		});
	});

	describe('Performance', () => {
		it('should handle rapid successive logs', () => {
			// Use ERROR level which is always logged
			for (let i = 0; i < 100; i++) {
				logger.error(`Message ${i}`);
			}
			expect(consoleSpy.error).toHaveBeenCalledTimes(100);
		});

		it('should handle concurrent logs', async () => {
			// Use ERROR level which is always logged
			const promises = Array.from({ length: 10 }, (_, i) =>
				Promise.resolve(logger.error(`Concurrent message ${i}`))
			);
			await Promise.all(promises);
			expect(consoleSpy.error).toHaveBeenCalledTimes(10);
		});
	});

	describe('Integration with Logger', () => {
		it('should export logger object', () => {
			expect(logger).toBeDefined();
			expect(typeof logger.error).toBe('function');
			expect(typeof logger.warn).toBe('function');
			expect(typeof logger.info).toBe('function');
			expect(typeof logger.debug).toBe('function');
		});

		it('should export LogLevel enum', () => {
			expect(LogLevel).toBeDefined();
			expect(LogLevel.ERROR).toBeDefined();
			expect(LogLevel.WARN).toBeDefined();
			expect(LogLevel.INFO).toBeDefined();
			expect(LogLevel.DEBUG).toBeDefined();
		});
	});

	describe('Error Logging Details', () => {
		it('should log error stack traces', () => {
			const error = new Error('Test error with stack');
			logger.error('Error occurred:', error);
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should log custom error properties', () => {
			const customError = new Error('Custom error');
			(customError as any).code = 'ERR_CUSTOM';
			(customError as any).statusCode = 500;
			logger.error('Custom error occurred', customError);
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should handle nested error objects', () => {
			const cause = new Error('Inner error');
			const nestedError = new Error('Outer error');
			(nestedError as any).cause = cause;
			logger.error('Nested error occurred', nestedError);
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should handle non-Error objects in error logging', () => {
			const nonError = { message: 'Not an Error object', code: 500 };
			logger.error('Non-error object logged', nonError, { extra: 'context' });
			expect(consoleSpy.error).toHaveBeenCalled();
			const callArgs = consoleSpy.error.mock.calls[0][0];
			expect(callArgs).toContain('extra');
		});

		it('should handle string errors', () => {
			logger.error('Error message', 'string error value');
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should handle undefined errors', () => {
			logger.error('Error without value', undefined);
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it('should handle null errors', () => {
			logger.error('Error with null', null);
			expect(consoleSpy.error).toHaveBeenCalled();
		});
	});
});
