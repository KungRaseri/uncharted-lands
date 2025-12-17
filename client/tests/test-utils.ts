/**
 * Test Utilities
 *
 * Common helpers for testing Svelte components and stores
 */

import { render as testingLibraryRender } from '@testing-library/svelte';

type EventHandler = (...args: unknown[]) => void;

/**
 * Mock Socket.IO client for testing
 */
export class MockSocket {
	private readonly handlers: Map<string, EventHandler[]> = new Map();
	public connected = false;

	on(event: string, handler: EventHandler) {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, []);
		}
		this.handlers.get(event)!.push(handler);
	}

	emit(event: string, ...args: unknown[]) {
		// Simulate emit - in tests, we'll manually trigger handlers
		console.log(`[MockSocket] emit: ${event}`, args);
	}

	trigger(event: string, ...args: unknown[]) {
		// Manually trigger event handlers (for testing)
		const handlers = this.handlers.get(event) || [];
		for (const handler of handlers) {
			handler(...args);
		}
	}

	connect() {
		this.connected = true;
		this.trigger('connected');
	}

	disconnect() {
		this.connected = false;
		this.trigger('disconnected');
	}

	off(event: string, handler?: EventHandler) {
		if (handler) {
			const handlers = this.handlers.get(event) || [];
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		} else {
			this.handlers.delete(event);
		}
	}

	removeAllListeners() {
		this.handlers.clear();
	}
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
	private readonly store: Map<string, string> = new Map();

	getItem(key: string): string | null {
		return this.store.get(key) || null;
	}

	setItem(key: string, value: string): void {
		this.store.set(key, value);
	}

	removeItem(key: string): void {
		this.store.delete(key);
	}

	clear(): void {
		this.store.clear();
	}

	get length(): number {
		return this.store.size;
	}

	key(index: number): string | null {
		return Array.from(this.store.keys())[index] || null;
	}
}

/**
 * Setup mock localStorage
 */
export function setupMockLocalStorage(): MockLocalStorage {
	const mockStorage = new MockLocalStorage();
	globalThis.localStorage = mockStorage as Storage;
	return mockStorage;
}

/**
 * Setup mock Socket.IO
 */
export function setupMockSocket(): MockSocket {
	const mockSocket = new MockSocket();
	// You can inject this into your stores during tests
	return mockSocket;
}

/**
 * Enhanced render function with common setup
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function render(component: any, options?: any) {
	// Setup mocks
	const mockLocalStorage = setupMockLocalStorage();
	const mockSocket = setupMockSocket();

	// Render component
	const result = testingLibraryRender(component, options);

	return {
		...result,
		mockLocalStorage,
		mockSocket
	};
}

interface MockSettlement {
	id: string;
	name: string;
	playerProfileId: string;
	worldId: string;
	tileId: string;
	resilience: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Mock settlement data generator
 */
export function createMockSettlement(overrides: Partial<MockSettlement> = {}): MockSettlement {
	return {
		id: 'settlement-123',
		name: 'Test Settlement',
		playerProfileId: 'player-123',
		worldId: 'world-123',
		tileId: 'tile-123',
		resilience: 50,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

interface MockStructure {
	id: string;
	settlementId: string;
	structureId: string;
	name: string;
	level: number;
	health: number;
	category: string;
	tileId: string;
	slotPosition: number;
}

/**
 * Mock structure data generator
 */
export function createMockStructure(overrides: Partial<MockStructure> = {}): MockStructure {
	return {
		id: 'structure-123',
		settlementId: 'settlement-123',
		structureId: 'FARM',
		name: 'Farm',
		level: 1,
		health: 100,
		category: 'EXTRACTOR',
		tileId: 'tile-456',
		slotPosition: 0,
		...overrides
	};
}

interface MockAlert {
	id: string;
	settlementId: string;
	type: string;
	severity: string;
	message: string;
	timestamp: number;
	read: boolean;
}

/**
 * Mock alert data generator
 */
export function createMockAlert(overrides: Partial<MockAlert> = {}): MockAlert {
	return {
		id: 'alert-123',
		settlementId: 'settlement-123',
		type: 'warning',
		severity: 'medium',
		message: 'Test alert',
		timestamp: Date.now(),
		read: false,
		...overrides
	};
}

interface MockConstructionItem {
	id: string;
	settlementId: string;
	structureType: string;
	status: string;
	startedAt: number;
	completesAt: number;
	resourcesCost: {
		wood: number;
		stone: number;
	};
	position: number;
}

/**
 * Mock construction queue item generator
 */
export function createMockConstructionItem(
	overrides: Partial<MockConstructionItem> = {}
): MockConstructionItem {
	return {
		id: 'construction-123',
		settlementId: 'settlement-123',
		structureType: 'FARM',
		status: 'IN_PROGRESS',
		startedAt: Date.now() - 60000, // 1 minute ago
		completesAt: Date.now() + 60000, // 1 minute from now
		resourcesCost: {
			wood: 20,
			stone: 10
		},
		position: 0,
		...overrides
	};
}

/**
 * Wait for a condition to be true (with timeout)
 */
export async function waitFor(
	condition: () => boolean,
	options: { timeout?: number; interval?: number } = {}
): Promise<void> {
	const { timeout = 1000, interval = 50 } = options;
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		if (condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	throw new Error('waitFor timed out');
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}
