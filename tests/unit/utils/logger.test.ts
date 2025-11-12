import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '../../../src/lib/utils/logger';

describe('Client Logger', () => {
	let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {}) as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}) as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as any;
	});

	afterEach(() => {
		consoleDebugSpy.mockRestore();
		consoleLogSpy.mockRestore();
		consoleWarnSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe('debug', () => {
		it('should log debug messages in development mode', () => {
			logger.debug('Test debug message');
			// In test environment, this depends on VITE_LOG_LEVEL
			// We'll just verify it doesn't throw
			expect(consoleDebugSpy).toHaveBeenCalled();
		});

		it('should include context in debug messages', () => {
			logger.debug('Test with context', { key: 'value', number: 42 });
			expect(consoleDebugSpy).toHaveBeenCalled();
			const call = consoleDebugSpy.mock.calls[0][0];
			const contextArg = consoleDebugSpy.mock.calls[0][3]; // Context is 4th arg
			expect(call).toContain('DEBUG');
			expect(call).toContain('Test with context');
			expect(contextArg).toContain('key');
			expect(contextArg).toContain('value');
		});
	});

	describe('info', () => {
		it('should log info messages', () => {
			logger.info('Test info message');
			expect(consoleLogSpy).toHaveBeenCalled();
			const call = consoleLogSpy.mock.calls[0][0];
			expect(call).toContain('INFO');
			expect(call).toContain('Test info message');
		});

		it('should include context in info messages', () => {
			logger.info('Info with context', { userId: '123', action: 'login' });
			expect(consoleLogSpy).toHaveBeenCalled();
			const contextArg = consoleLogSpy.mock.calls[0][3]; // Context is 4th arg
			expect(contextArg).toContain('userId');
			expect(contextArg).toContain('123');
		});

		it('should include timestamp in messages', () => {
			logger.info('Test timestamp');
			expect(consoleLogSpy).toHaveBeenCalled();
			const call = consoleLogSpy.mock.calls[0][0];
			// Should contain HH:MM:SS time format (not full ISO)
			expect(call).toMatch(/\[\d{2}:\d{2}:\d{2}/);
		});
	});

	describe('warn', () => {
		it('should log warning messages', () => {
			logger.warn('Test warning message');
			expect(consoleWarnSpy).toHaveBeenCalled();
			const call = consoleWarnSpy.mock.calls[0][0];
			expect(call).toContain('WARN');
			expect(call).toContain('Test warning message');
		});

		it('should include context in warning messages', () => {
			logger.warn('Warning with context', { reason: 'deprecated', endpoint: '/api/old' });
			expect(consoleWarnSpy).toHaveBeenCalled();
			const contextArg = consoleWarnSpy.mock.calls[0][3]; // Context is 4th arg
			expect(contextArg).toContain('reason');
			expect(contextArg).toContain('deprecated');
		});
	});

	describe('error', () => {
		it('should log error messages', () => {
			logger.error('Test error message');
			expect(consoleErrorSpy).toHaveBeenCalled();
			const call = consoleErrorSpy.mock.calls[0][0];
			expect(call).toContain('ERROR');
			expect(call).toContain('Test error message');
		});

		it('should include Error objects in error messages', () => {
			const error = new Error('Something went wrong');
			logger.error('Error occurred', error);
			expect(consoleErrorSpy).toHaveBeenCalled();
			const call = consoleErrorSpy.mock.calls[0][0];
			const contextArg = consoleErrorSpy.mock.calls[0][3]; // Context is 4th arg
			expect(call).toContain('Error occurred');
			expect(contextArg).toContain('Something went wrong');
			expect(contextArg).toContain('name');
			expect(contextArg).toContain('message');
		});

		it('should include non-Error objects in error messages', () => {
			const error = { code: 'CUSTOM_ERROR', details: 'Something failed' };
			logger.error('Custom error', error);
			expect(consoleErrorSpy).toHaveBeenCalled();
			const call = consoleErrorSpy.mock.calls[0][0];
			expect(call).toContain('Custom error');
			expect(call).toContain('code');
			expect(call).toContain('CUSTOM_ERROR');
		});

		it('should include context along with error', () => {
			const error = new Error('Test error');
			logger.error('Error with context', error, { userId: '456', action: 'delete' });
			expect(consoleErrorSpy).toHaveBeenCalled();
			const call = consoleErrorSpy.mock.calls[0][0];
			expect(call).toContain('userId');
			expect(call).toContain('456');
			expect(call).toContain('Test error');
		});

		it('should handle null/undefined errors', () => {
			logger.error('Error without error object', undefined, { info: 'test' });
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe('isDev', () => {
		it('should return boolean for development mode check', () => {
			const isDev = logger.isDev();
			expect(typeof isDev).toBe('boolean');
		});
	});

	describe('maskEmail', () => {
		it('should mask email address', () => {
			const masked = logger.maskEmail('test@example.com');
			expect(masked).toBe('tes***@example.com');
		});

		it('should mask short email addresses', () => {
			const masked = logger.maskEmail('a@example.com');
			expect(masked).toBe('a***@example.com');
		});

		it('should mask two-char email addresses', () => {
			const masked = logger.maskEmail('ab@example.com');
			expect(masked).toBe('ab***@example.com');
		});

		it('should mask long email addresses', () => {
			const masked = logger.maskEmail('verylongemail@example.com');
			expect(masked).toBe('ver***@example.com');
		});

		it('should return *** for invalid email format', () => {
			const masked = logger.maskEmail('notanemail');
			expect(masked).toBe('***');
		});

		it('should return *** for empty string', () => {
			const masked = logger.maskEmail('');
			expect(masked).toBe('***');
		});

		it('should handle email with no local part', () => {
			const masked = logger.maskEmail('@example.com');
			expect(masked).toBe('***');
		});

		it('should handle email with no domain', () => {
			const masked = logger.maskEmail('test@');
			expect(masked).toBe('***');
		});
	});

	describe('context handling', () => {
		it('should not include context when empty object is passed', () => {
			logger.info('Test message', {});
			expect(consoleLogSpy).toHaveBeenCalled();
			const call = consoleLogSpy.mock.calls[0][0];
			// Empty context should not be stringified
			expect(call).not.toContain('{}');
		});

		it('should handle complex nested context', () => {
			logger.info('Complex context', {
				user: { id: 1, name: 'Test' },
				metadata: { tags: ['a', 'b'], count: 5 }
			});
			expect(consoleLogSpy).toHaveBeenCalled();
			const call = consoleLogSpy.mock.calls[0][0];
			expect(call).toContain('user');
			expect(call).toContain('metadata');
		});
	});

	describe('LogLevel enum', () => {
		it('should have correct numeric values', () => {
			expect(LogLevel.DEBUG).toBe(0);
			expect(LogLevel.INFO).toBe(1);
			expect(LogLevel.WARN).toBe(2);
			expect(LogLevel.ERROR).toBe(3);
		});
	});
});
