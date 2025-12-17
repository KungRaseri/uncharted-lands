import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../../../src/api/routes/auth.js';
import * as db from '../../../src/db/index.js';
import { generateTestId, generateTestPassword } from '../../helpers/test-utils';

// Mock dependencies
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			accounts: {
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn().mockResolvedValue(undefined),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn().mockResolvedValue(undefined),
			})),
		})),
	},
}));

vi.mock('../../../src/db/schema.js', () => ({
	accounts: { email: 'email', id: 'id', userAuthToken: 'userAuthToken' },
	profiles: {},
}));

vi.mock('@paralleldrive/cuid2', () => ({
	createId: vi.fn(() => generateTestId()),
}));

vi.mock('bcrypt', () => ({
	default: {
		hash: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
		compare: vi.fn((password: string, hash: string) => {
			// Simple mock: check if hash starts with 'hashed_' and matches password
			return Promise.resolve(hash === `hashed_${password}`);
		}),
	},
}));

describe('Auth API Routes', () => {
	let app: express.Application;
	const TEST_PASSWORD = generateTestPassword();

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use('/api/auth', authRouter);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('POST /api/auth/register', () => {
		it('should return 400 if email is missing', async () => {
			const response = await request(app)
				.post('/api/auth/register')
				.send({ password: TEST_PASSWORD, username: 'testuser' })
				.expect(400);

			expect(response.body.error).toBe('Email and password are required');
		});

		it('should return 400 if password is missing', async () => {
			const response = await request(app)
				.post('/api/auth/register')
				.send({ email: 'test@example.com', username: 'testuser' })
				.expect(400);

			expect(response.body.error).toBe('Email and password are required');
		});

		it('should successfully register without username', async () => {
			// Username is optional - can be set later when joining a world
			vi.mocked(db.db.query.accounts.findFirst)
				.mockResolvedValueOnce(null as any)
				.mockResolvedValueOnce({
					id: 'new-account-id',
					email: 'test@example.com',
					profile: {
						id: 'profile-id',
						username: null,
					},
				} as any);

			const response = await request(app)
				.post('/api/auth/register')
				.send({ email: 'test@example.com', password: TEST_PASSWORD })
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.account).toBeDefined();
		});

		it('should return 400 if account already exists', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'existing-id',
				email: 'test@example.com',
			} as any);

			const response = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test@example.com',
					password: TEST_PASSWORD,
					username: 'testuser',
				})
				.expect(400);

			expect(response.body.error).toBe('An account with this email already exists');
		});

		it('should successfully register a new account', async () => {
			// First call returns null (account doesn't exist)
			// Second call returns the newly created account
			vi.mocked(db.db.query.accounts.findFirst)
				.mockResolvedValueOnce(null as any)
				.mockResolvedValueOnce({
					id: 'new-account-id',
					email: 'newuser@example.com',
					profile: {
						id: 'profile-id',
						username: 'newuser',
					},
				} as any);

			const response = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'newuser@example.com',
					password: TEST_PASSWORD,
					username: 'newuser',
				})
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.account).toBeDefined();
			expect(response.body.account.email).toBe('newuser@example.com');
		});

		it('should return 500 on database error during registration', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(
				new Error('Database connection failed')
			);

			const response = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test@example.com',
					password: TEST_PASSWORD,
					username: 'testuser',
				})
				.expect(500);

			expect(response.body.error).toBe('Database error. Please try again later.');
		});
	});

	describe('POST /api/auth/login', () => {
		it('should return 400 if email is missing', async () => {
			const response = await request(app)
				.post('/api/auth/login')
				.send({ password: TEST_PASSWORD })
				.expect(400);

			expect(response.body.error).toBe('Email and password are required');
		});

		it('should return 400 if password is missing', async () => {
			const response = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test@example.com' })
				.expect(400);

			expect(response.body.error).toBe('Email and password are required');
		});

		it('should return 401 if account not found', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'nonexistent@example.com',
					password: TEST_PASSWORD,
				})
				.expect(401);

			expect(response.body.error).toBe('Invalid email or password');
		});

		it('should return 401 if password is incorrect', async () => {
			// Mock database with a different password hash
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'user-123',
				email: 'test@example.com',
				passwordHash: 'hashed_correct_password', // This is the hash of 'correct_password'
				profile: {
					id: 'profile-123',
					username: 'testuser',
				},
			} as any);

			const response = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'test@example.com',
					password: 'wrong-password', // Different password, so bcrypt.compare will return false
				})
				.expect(401);

			expect(response.body.error).toBe('Invalid email or password');
		});

		it('should successfully login with correct credentials', async () => {
			// Mock database to return an account with a hashed password
			// Our bcrypt mock will hash TEST_PASSWORD to 'hashed_' + TEST_PASSWORD
			const testPasswordHash = `hashed_${TEST_PASSWORD}`;
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'user-123',
				email: 'test@example.com',
				passwordHash: testPasswordHash,
				profile: {
					id: 'profile-123',
					username: 'testuser',
				},
			} as any);

			const response = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'test@example.com',
					password: TEST_PASSWORD, // Send plain password, bcrypt.compare will handle it
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.account).toBeDefined();
			expect(response.body.account.userAuthToken).toBeDefined();
		});

		it('should return 500 on database error during login', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'test@example.com',
					password: TEST_PASSWORD,
				})
				.expect(500);

			expect(response.body.error).toBe('Failed to login');
		});
	});

	describe('POST /api/auth/validate', () => {
		it('should return 400 if token is missing', async () => {
			const response = await request(app).post('/api/auth/validate').send({}).expect(400);

			expect(response.body.error).toBe('Token is required');
		});

		it('should return 401 if token is invalid', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.post('/api/auth/validate')
				.send({ token: 'invalid-token' })
				.expect(401);

			expect(response.body.error).toBe('Invalid token');
		});

		it('should successfully validate a valid token', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'user-123',
				email: 'test@example.com',
				userAuthToken: 'valid-token',
				profile: {
					id: 'profile-123',
					username: 'testuser',
				},
			} as any);

			const response = await request(app)
				.post('/api/auth/validate')
				.send({ token: 'valid-token' })
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.account).toBeDefined();
			expect(response.body.account.email).toBe('test@example.com');
		});

		it('should return 500 on database error during validation', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.post('/api/auth/validate')
				.send({ token: 'some-token' })
				.expect(500);

			expect(response.body.error).toBe('Failed to validate token');
		});
	});
});
