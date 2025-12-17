import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRouter from '../../../src/api/index.js';

describe('API Health Check', () => {
	const app = express();
	app.use('/api', apiRouter);

	describe('GET /api/health', () => {
		it('should return health status', async () => {
			const response = await request(app).get('/api/health').expect(200);

			expect(response.body).toHaveProperty('status', 'healthy');
			expect(response.body).toHaveProperty('api', 'REST API v1');
			expect(response.body).toHaveProperty('timestamp');
			expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it('should return JSON content type', async () => {
			const response = await request(app).get('/api/health').expect(200);

			expect(response.headers['content-type']).toMatch(/application\/json/);
		});

		it('should return current timestamp', async () => {
			const beforeRequest = Date.now();
			const response = await request(app).get('/api/health').expect(200);
			const afterRequest = Date.now();

			const responseTimestamp = new Date(response.body.timestamp).getTime();

			// Timestamp should be between before and after the request
			expect(responseTimestamp).toBeGreaterThanOrEqual(beforeRequest - 1000); // 1s buffer
			expect(responseTimestamp).toBeLessThanOrEqual(afterRequest + 1000); // 1s buffer
		});
	});
});
