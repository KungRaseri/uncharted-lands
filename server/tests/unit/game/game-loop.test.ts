/**
 * Game Loop Tests - Refactored for World-Based Processing
 *
 * Tests for the timing-aligned game loop that processes all settlements in READY worlds
 *
 * ARCHITECTURE CHANGE (December 2025):
 * - Removed: Settlement registration system (registerSettlement, unregisterSettlement, etc.)
 * - New: World-based processing - all settlements in READY worlds are processed automatically
 * - New: Timing-based production (aligned to real-world time intervals)
 * - New: Separate production vs projection Socket.IO events
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startGameLoop, stopGameLoop, getGameLoopStatus } from '../../../src/game/game-loop.js';

// Mock Socket.IO
const mockIo = {
	to: vi.fn().mockReturnThis(),
	emit: vi.fn(),
	engine: { clientsCount: 0 },
};

// Mock database queries
vi.mock('../../../src/db/queries.js', () => ({
	getPlayerSettlements: vi.fn(),
	updateSettlementStorage: vi.fn(),
	getSettlementWithDetails: vi.fn(),
	getSettlementStructures: vi.fn(),
	getSettlementPopulation: vi.fn(),
	updateSettlementPopulation: vi.fn(),
}));

// Mock database
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			worlds: {
				findMany: vi.fn().mockResolvedValue([]), // Default: no worlds
			},
			settlements: {
				findMany: vi.fn().mockResolvedValue([]), // Default: no settlements
			},
		},
	},
}));

// Mock resource calculator
vi.mock('../../../src/game/resource-calculator.js', () => ({
	calculateProduction: vi.fn(() => ({
		food: 10,
		water: 10,
		wood: 5,
		stone: 3,
		ore: 1,
	})),
	addResources: vi.fn((a, b) => ({
		food: a.food + b.food,
		water: a.water + b.water,
		wood: a.wood + b.wood,
		stone: a.stone + b.stone,
		ore: a.ore + b.ore,
	})),
	subtractResources: vi.fn((a, b) => ({
		food: a.food - b.food,
		water: a.water - b.water,
		wood: a.wood - b.wood,
		stone: a.stone - b.stone,
		ore: a.ore - b.ore,
	})),
}));

// Mock consumption calculator
vi.mock('../../../src/game/consumption-calculator.js', () => ({
	calculatePopulation: vi.fn(() => 10),
	calculateConsumption: vi.fn(() => ({
		food: 5,
		water: 5,
		wood: 0,
		stone: 0,
		ore: 0,
	})),
	hasResourcesForPopulation: vi.fn(() => true),
}));

// Mock storage calculator
vi.mock('../../../src/game/storage-calculator.js', () => ({
	calculateStorageCapacity: vi.fn(() => ({
		food: 1000,
		water: 1000,
		wood: 500,
		stone: 500,
		ore: 200,
	})),
	clampToCapacity: vi.fn((resources) => resources),
	calculateWaste: vi.fn(() => ({
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0,
	})),
	isNearCapacity: vi.fn(() => ({
		food: false,
		water: false,
		wood: false,
		stone: false,
		ore: false,
	})),
}));

// Mock population calculator
vi.mock('../../../src/game/population-calculator.js', () => ({
	calculatePopulationState: vi.fn(() => ({
		current: 10,
		capacity: 20,
		happiness: 75,
		growthRate: 0.02,
		immigrationChance: 0.1,
		emigrationChance: 0,
	})),
	applyPopulationGrowth: vi.fn((current) => current),
	calculateImmigrationAmount: vi.fn(() => 0),
	calculateEmigrationAmount: vi.fn(() => 0),
	getPopulationSummary: vi.fn(() => ({
		happiness: 75,
		happinessDescription: 'Happy',
		status: 'growing',
	})),
}));

// Mock population assignment
vi.mock('../../../src/game/population-assignment.js', () => ({
	autoAssignPopulation: vi.fn(() => ({
		assigned: 5,
		available: 5,
	})),
	calculateAllStaffingBonuses: vi.fn(() => ({})),
}));

// Mock disaster systems
vi.mock('../../../src/game/disaster-scheduler.js', () => ({
	processHourlyDisasterChecks: vi.fn(),
}));

vi.mock('../../../src/game/disaster-processor.js', () => ({
	processDisasters: vi.fn(),
}));

vi.mock('../../../src/game/disaster-damage-calculator.js', () => ({
	calculateAllDisasterModifiers: vi.fn(() => ({
		baseProductionModifier: 1,
	})),
}));

// Mock passive repair
vi.mock('../../../src/game/passive-repair.js', () => ({
	processPassiveRepairs: vi.fn().mockResolvedValue({
		settlementsProcessed: 0,
		settlementsWithWorkshop: 0,
		totalStructuresRepaired: 0,
	}),
}));

// Mock construction queue processor
vi.mock('../../../src/game/construction-queue-processor.js', () => ({
	processConstructionQueues: vi.fn(),
}));

// Mock world templates
vi.mock('../../../src/types/world-templates.js', () => ({
	getWorldTemplateConfig: vi.fn(() => ({
		resourceProductionMultiplier: 1,
		resourceConsumptionMultiplier: 1,
		populationGrowthMultiplier: 1,
	})),
}));

describe('Game Loop - World-Based Processing', () => {
	beforeEach(() => {
		// Stop any running game loop before each test
		const status = getGameLoopStatus();
		if (status.isRunning) {
			stopGameLoop();
		}

		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up after each test
		const status = getGameLoopStatus();
		if (status.isRunning) {
			stopGameLoop();
		}
	});

	describe('Game Loop Control', () => {
		it('should start the game loop', () => {
			expect(getGameLoopStatus().isRunning).toBe(false);
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);
		});

		it('should not start if already running', () => {
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);

			// Try to start again - should warn but not error
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);
		});

		it('should stop the game loop', () => {
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);

			stopGameLoop();
			expect(getGameLoopStatus().isRunning).toBe(false);
		});

		it('should not error when stopping if not running', () => {
			expect(getGameLoopStatus().isRunning).toBe(false);
			expect(() => stopGameLoop()).not.toThrow();
		});

		it('should reset tick counter when stopped', async () => {
			startGameLoop(mockIo as any);

			// Wait a bit for some ticks to occur
			await new Promise((resolve) => setTimeout(resolve, 50));

			const runningStatus = getGameLoopStatus();
			expect(runningStatus.currentTick).toBeGreaterThan(0);

			stopGameLoop();

			const stoppedStatus = getGameLoopStatus();
			expect(stoppedStatus.currentTick).toBe(0);
			expect(stoppedStatus.isRunning).toBe(false);
		});
	});

	describe('Game Loop State', () => {
		it('should track running state correctly', () => {
			expect(getGameLoopStatus().isRunning).toBe(false);

			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);

			stopGameLoop();
			expect(getGameLoopStatus().isRunning).toBe(false);
		});

		it('should maintain state across multiple start/stop cycles', () => {
			// First cycle
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);
			stopGameLoop();
			expect(getGameLoopStatus().isRunning).toBe(false);

			// Second cycle
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);
			stopGameLoop();
			expect(getGameLoopStatus().isRunning).toBe(false);
		});

		it('should track tick count', () => {
			const status = getGameLoopStatus();
			expect(status.currentTick).toBeDefined();
			expect(typeof status.currentTick).toBe('number');
		});

		it('should report tick rate', () => {
			const status = getGameLoopStatus();
			expect(status.tickRate).toBeDefined();
			expect(typeof status.tickRate).toBe('number');
			expect(status.tickRate).toBeGreaterThan(0);
		});

		it('should increment tick count when running', async () => {
			startGameLoop(mockIo as any);

			// Wait for ticks to accumulate
			await new Promise((resolve) => setTimeout(resolve, 50));

			const status = getGameLoopStatus();
			expect(status.currentTick).toBeGreaterThan(0);
			stopGameLoop();
		});
	});

	describe('Tick Rate Configuration', () => {
		it('should use default tick rate of 60', () => {
			const status = getGameLoopStatus();
			expect(status.tickRate).toBe(60);
		});

		it('should start and stop cleanly', () => {
			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);

			stopGameLoop();
			expect(getGameLoopStatus().isRunning).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid start/stop cycles', () => {
			for (let i = 0; i < 5; i++) {
				startGameLoop(mockIo as any);
				expect(getGameLoopStatus().isRunning).toBe(true);
				stopGameLoop();
				expect(getGameLoopStatus().isRunning).toBe(false);
			}
		});

		it('should handle multiple stop calls gracefully', () => {
			startGameLoop(mockIo as any);
			stopGameLoop();

			expect(() => stopGameLoop()).not.toThrow();
			expect(() => stopGameLoop()).not.toThrow();
		});

		it('should handle multiple start calls gracefully', () => {
			startGameLoop(mockIo as any);

			expect(() => startGameLoop(mockIo as any)).not.toThrow();
			expect(() => startGameLoop(mockIo as any)).not.toThrow();

			expect(getGameLoopStatus().isRunning).toBe(true);
			stopGameLoop();
		});
	});

	describe('World-Based Processing Architecture', () => {
		it('should not have settlement registration functions', async () => {
			// The refactor removed these functions - verify they don't exist
			const gameLoop = await import('../../../src/game/game-loop.js');

			expect((gameLoop as any).registerSettlement).toBeUndefined();
			expect((gameLoop as any).unregisterSettlement).toBeUndefined();
			expect((gameLoop as any).registerPlayerSettlements).toBeUndefined();
			expect((gameLoop as any).unregisterPlayerSettlements).toBeUndefined();
		});

		it('should not track active settlements count', () => {
			// The new architecture processes all settlements in READY worlds
			// There is no longer an activeSettlements counter
			const status = getGameLoopStatus();

			// Type assertion to check property doesn't exist
			expect((status as any).activeSettlements).toBeUndefined();
		});

		it('should export only control functions and status', async () => {
			const gameLoop = await import('../../../src/game/game-loop.js');

			// Verify expected exports exist
			expect(gameLoop.startGameLoop).toBeDefined();
			expect(gameLoop.stopGameLoop).toBeDefined();
			expect(gameLoop.getGameLoopStatus).toBeDefined();

			// Verify old settlement management exports don't exist
			expect((gameLoop as any).registerSettlement).toBeUndefined();
			expect((gameLoop as any).unregisterSettlement).toBeUndefined();
		});
	});

	describe('Timing-Based Processing', () => {
		it('should process settlements based on time intervals, not registration', () => {
			// The new architecture processes settlements at specific time intervals:
			// - Resource production: every RESOURCE_INTERVAL_SEC (default 3600s = 1 hour)
			// - Socket projections: every SOCKET_EMIT_INTERVAL_SEC (default 1s)
			// - Population updates: every POPULATION_INTERVAL_SEC (default 1800s = 30 min)

			startGameLoop(mockIo as any);

			// Game loop should start without needing any settlement registration
			expect(getGameLoopStatus().isRunning).toBe(true);

			stopGameLoop();
		});

		it('should handle empty worlds gracefully', () => {
			// With no READY worlds in database, the game loop should still run
			// but simply skip processing (no settlements to process)

			startGameLoop(mockIo as any);
			expect(getGameLoopStatus().isRunning).toBe(true);

			// Should not error even with no worlds/settlements
			stopGameLoop();
		});
	});
});
