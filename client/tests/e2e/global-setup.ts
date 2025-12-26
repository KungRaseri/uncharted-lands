/**
 * Playwright Global Setup
 * 
 * Runs ONCE before all test suites to create shared test data:
 * - One E2E Test Server
 * - One shared test world per test category (if needed)
 * - Admin account for server/world management
 * 
 * This dramatically speeds up test execution by avoiding redundant
 * server/world creation in every test suite.
 */

import { chromium, type FullConfig } from '@playwright/test';
import { registerUser } from './auth/auth.helpers';
import crypto from 'node:crypto';

const API_BASE_URL = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

interface GlobalTestData {
	// Shared server (all tests use this)
	testServerId: string;
	
	// Shared admin account (for server/world management)
	adminEmail: string;
	adminSessionToken: string;
	
	// Shared worlds (create one per test category if needed)
	generalWorldId?: string; // For most tests
	disasterWorldId?: string; // For disaster-specific tests
	multiplayerWorldId?: string; // For multiplayer tests
}

async function globalSetup(_config: FullConfig) {
	console.log('\n========================================');
	console.log('🚀 GLOBAL TEST SETUP - Creating shared test data');
	console.log('========================================\n');

	const browser = await chromium.launch();
	const context = await browser.newContext({
		baseURL: 'http://localhost:3000' // SvelteKit dev server
	});
	const page = await context.newPage();

	try {
		// ========================================
		// 1. Create admin account
		// ========================================
		console.log('📝 Step 1: Creating admin account...');
		const adminEmail = `e2e-admin-${Date.now()}@test.local`;
		const adminPassword = 'TestPassword1234567890!';
		
		await registerUser(page, adminEmail, adminPassword);
		
		const cookies = await context.cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		
		if (!sessionCookie) {
			throw new Error('❌ No session cookie found after admin registration');
		}
		
		const adminSessionToken = sessionCookie.value;
		console.log('✅ Admin account created:', adminEmail);

		// Elevate to admin
		await page.request.put(
			`${API_BASE_URL}/test/elevate-admin/${encodeURIComponent(adminEmail)}`
		);
		console.log('✅ Admin privileges granted');

		// ========================================
		// 2. Create or reuse shared test server
		// ========================================
		console.log('\n🖥️  Step 2: Setting up shared test server...');
		
		const serversResponse = await page.request.get(`${API_BASE_URL}/servers`, {
			headers: { Cookie: `session=${adminSessionToken}` }
		});
		
		const serversData = await serversResponse.json();
		const servers = Array.isArray(serversData) ? serversData : serversData.servers || [];
		let testServer = servers.find(
			(s: { name: string; hostname: string; port: number }) =>
				s.name === 'E2E Test Server' && s.hostname === 'localhost' && s.port === 3001
		);

		if (!testServer) {
			console.log('📦 Creating new test server...');
			const createServerResponse = await page.request.post(`${API_BASE_URL}/servers`, {
				headers: { Cookie: `session=${adminSessionToken}` },
				data: {
					name: 'E2E Test Server',
					hostname: 'localhost',
					port: 3001,
					status: 'ONLINE'
				}
			});
			
			if (!createServerResponse.ok()) {
				const errorText = await createServerResponse.text();
				
				// If server already exists (race condition or previous failed test), try to fetch it again
				if (errorText.includes('CREATE_FAILED') || errorText.includes('duplicate') || errorText.includes('unique')) {
					console.log('⚠️  Server creation failed (might already exist), fetching servers again...');
					const retryResponse = await page.request.get(`${API_BASE_URL}/servers`, {
						headers: { Cookie: `session=${adminSessionToken}` }
					});
					const retryData = await retryResponse.json();
					const retryServers = Array.isArray(retryData) ? retryData : retryData.servers || [];
					testServer = retryServers.find(
						(s: { name: string; hostname: string; port: number }) =>
							s.hostname === 'localhost' && s.port === 3001
					);
					
					if (testServer) {
						console.log('✅ Found existing server after retry:', testServer.id);
					} else {
						throw new Error(`Failed to create or find server after retry. Error: ${errorText}`);
					}
				} else {
					throw new Error(`Failed to create server: ${createServerResponse.status()} - ${errorText}`);
				}
			} else {
				testServer = await createServerResponse.json();
				if (!testServer || !testServer.id) {
					throw new Error(`Server creation returned invalid data: ${JSON.stringify(testServer)}`);
				}
				console.log('✅ Test server created:', testServer.id);
			}
		} else {
			console.log('✅ Reusing existing test server:', testServer.id);
		}
		
		if (!testServer || !testServer.id) {
			throw new Error(`No valid server found or created. testServer: ${JSON.stringify(testServer)}`);
		}

		// ========================================
		// 3. Create shared world (for general tests)
		// ========================================
		console.log('\n🌍 Step 3: Creating shared world for general tests...');
		
		const worldName = `E2E Shared World ${Date.now()}`;
		const worldResponse = await page.request.post(`${API_BASE_URL}/worlds`, {
			headers: { Cookie: `session=${adminSessionToken}` },
			data: {
				serverId: testServer.id,
				name: worldName,
				generate: true,
				width: 5,
				height: 5,
				elevationSeed: crypto.randomInt(0, 1000000),
				worldTemplateType: 'STANDARD'
			},
			timeout: 90000 // Increase timeout to 90 seconds for world creation (can take 60-80s for TINY worlds)
		});

		if (!worldResponse.ok()) {
			const errorText = await worldResponse.text();
			throw new Error(`Failed to create world: ${worldResponse.status()} - ${errorText}`);
		}

		const worldData = await worldResponse.json();
		console.log('⏳ World created, waiting for generation...');

		// Wait for world generation to complete
		let attempts = 0;
		const maxAttempts = 30; // 30 seconds max
		let generatedWorld;

		while (attempts < maxAttempts) {
			await page.waitForTimeout(1000);
			
			const checkResponse = await page.request.get(`${API_BASE_URL}/worlds/${worldData.id}`, {
				headers: { Cookie: `session=${adminSessionToken}` }
			});

			generatedWorld = await checkResponse.json();
			
			if (generatedWorld.status === 'ready') {
				console.log('✅ World generation complete!');
				break;
			} else if (generatedWorld.status === 'failed') {
				throw new Error('World generation failed');
			}
			
			attempts++;
			
			if (attempts % 5 === 0) {
				console.log(`⏳ Still generating... (${attempts}s)`);
			}
		}

		if (!generatedWorld || generatedWorld.status !== 'ready') {
			throw new Error('World generation timed out');
		}

		// ========================================
		// 4. Save global test data
		// ========================================
		const globalData: GlobalTestData = {
			testServerId: testServer.id,
			adminEmail,
			adminSessionToken,
			generalWorldId: generatedWorld.id
		};

		// Store in environment variables for tests to access
		process.env.E2E_TEST_SERVER_ID = globalData.testServerId;
		process.env.E2E_ADMIN_EMAIL = globalData.adminEmail;
		process.env.E2E_ADMIN_TOKEN = globalData.adminSessionToken;
		process.env.E2E_GENERAL_WORLD_ID = globalData.generalWorldId;

		console.log('\n========================================');
		console.log('✅ GLOBAL SETUP COMPLETE');
		console.log('========================================');
		console.log('📋 Shared test data:');
		console.log(`   Server ID: ${globalData.testServerId}`);
		console.log(`   World ID: ${globalData.generalWorldId}`);
		console.log(`   Admin: ${globalData.adminEmail}`);
		console.log('========================================\n');

	} catch (error) {
		console.error('\n❌ GLOBAL SETUP FAILED:', error);
		throw error;
	} finally {
		await page.close();
		await context.close();
		await browser.close();
	}
}

export default globalSetup;
