/**
 * Vitest Global Setup
 *
 * This file runs once before all tests to set up the test environment.
 */

import { logger } from '../../src/utils/logger.js';

export async function setup() {
	logger.info('[TEST SETUP] Starting test suite');

	// Ensure we're using test database
	if (!process.env.DATABASE_URL?.includes('test')) {
		logger.warn(
			'[TEST SETUP] WARNING: DATABASE_URL does not contain "test" - may be using production database!'
		);
	}

	const dbUrl = process.env.DATABASE_URL?.split('@')[1] || 'Not configured';
	logger.info('[TEST SETUP] Database', { database: dbUrl });
}

export async function teardown() {
	logger.info('[TEST SETUP] Test suite completed');
}
