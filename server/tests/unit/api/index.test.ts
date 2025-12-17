/**
 * Tests for API Index
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../../../src/api/index.js';

describe('API Router', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Router initialization', () => {
		it('should export an Express router', () => {
			expect(router).toBeDefined();
			expect(typeof router).toBe('function');
			// Express routers are functions with additional properties
			expect(router.use).toBeDefined();
			expect(router.get).toBeDefined();
			expect(router.post).toBeDefined();
		});

		it('should have health check route registered', () => {
			const routes = router.stack || [];
			const healthRoute = routes.some(
				(layer: any) => layer.route && layer.route.path === '/health'
			);

			expect(healthRoute).toBe(true);
		});
	});
});
