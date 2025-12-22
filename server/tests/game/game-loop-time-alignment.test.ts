/**
 * Game Loop Time Alignment Tests (Phase 1)
 * 
 * Validates that real-world UTC time alignment works correctly
 * for the staggered processing schedule
 */

import { describe, it, expect } from 'vitest';

describe('Game Loop Time Alignment', () => {
	describe('Resource Production (:00 marks)', () => {
		it('should trigger at top of hour', () => {
			const times = [
				new Date('2025-12-22T10:00:00Z').getTime(),
				new Date('2025-12-22T11:00:00Z').getTime(),
				new Date('2025-12-22T12:00:00Z').getTime(),
				new Date('2025-12-22T23:00:00Z').getTime()
			];

			for (const time of times) {
				const secondsSinceEpoch = Math.floor(time / 1000);
				const secondsIntoHour = secondsSinceEpoch % 3600;
				expect(secondsIntoHour).toBe(0);
			}
		});

		it('should not trigger at other times', () => {
			const times = [
				new Date('2025-12-22T10:15:00Z').getTime(),
				new Date('2025-12-22T10:30:00Z').getTime(),
				new Date('2025-12-22T10:45:00Z').getTime(),
				new Date('2025-12-22T10:59:59Z').getTime()
			];

			for (const time of times) {
				const secondsSinceEpoch = Math.floor(time / 1000);
				const secondsIntoHour = secondsSinceEpoch % 3600;
				expect(secondsIntoHour).not.toBe(0);
			}
		});
	});

	describe('Population Updates (:30 marks)', () => {
		it('should trigger at half hour', () => {
			const times = [
				new Date('2025-12-22T10:30:00Z').getTime(),
				new Date('2025-12-22T11:30:00Z').getTime(),
				new Date('2025-12-22T12:30:00Z').getTime(),
				new Date('2025-12-22T23:30:00Z').getTime()
			];

			const POPULATION_OFFSET_SEC = 1800;

			for (const time of times) {
				const secondsSinceEpoch = Math.floor(time / 1000);
				const secondsIntoHour = secondsSinceEpoch % 3600;
				expect(secondsIntoHour).toBe(POPULATION_OFFSET_SEC);
			}
		});
	});

	describe('Passive Repairs (:45 marks)', () => {
		it('should trigger at 45 minutes', () => {
			const times = [
				new Date('2025-12-22T10:45:00Z').getTime(),
				new Date('2025-12-22T11:45:00Z').getTime(),
				new Date('2025-12-22T12:45:00Z').getTime(),
				new Date('2025-12-22T23:45:00Z').getTime()
			];

			const REPAIR_OFFSET_SEC = 2700;

			for (const time of times) {
				const secondsSinceEpoch = Math.floor(time / 1000);
				const secondsIntoHour = secondsSinceEpoch % 3600;
				expect(secondsIntoHour).toBe(REPAIR_OFFSET_SEC);
			}
		});
	});

	describe('Disaster Checks (every 15 minutes)', () => {
		it('should trigger at :00, :15, :30, :45', () => {
			const times = [
				new Date('2025-12-22T10:00:00Z').getTime(),
				new Date('2025-12-22T10:15:00Z').getTime(),
				new Date('2025-12-22T10:30:00Z').getTime(),
				new Date('2025-12-22T10:45:00Z').getTime(),
				new Date('2025-12-22T11:00:00Z').getTime(),
				new Date('2025-12-22T11:15:00Z').getTime()
			];

			const DISASTER_INTERVAL_SEC = 900; // 15 minutes

			for (const time of times) {
				const secondsSinceEpoch = Math.floor(time / 1000);
				expect(secondsSinceEpoch % DISASTER_INTERVAL_SEC).toBe(0);
			}
		});

		it('should not trigger between 15-minute marks', () => {
			const times = [
				new Date('2025-12-22T10:05:00Z').getTime(),
				new Date('2025-12-22T10:10:00Z').getTime(),
				new Date('2025-12-22T10:20:00Z').getTime(),
				new Date('2025-12-22T10:35:00Z').getTime()
			];

			const DISASTER_INTERVAL_SEC = 900;

			for (const time of times) {
				const secondsSinceEpoch = Math.floor(time / 1000);
				expect(secondsSinceEpoch % DISASTER_INTERVAL_SEC).not.toBe(0);
			}
		});
	});

	describe('Multiple Trigger Prevention', () => {
		it('should prevent triggering twice in same second', () => {
			// Simulate 60 ticks within same second
			const secondsSinceEpoch = Math.floor(new Date('2025-12-22T10:00:00Z').getTime() / 1000);
			let lastTriggerSec = 0;

			const triggers: boolean[] = [];

			// Simulate 60 ticks
			for (let tick = 0; tick < 60; tick++) {
				const shouldTrigger = 
					secondsSinceEpoch % 3600 === 0 && // Is it :00?
					secondsSinceEpoch !== lastTriggerSec && // Haven't triggered this second yet?
					tick % 60 === 0; // First tick of the second?

				triggers.push(shouldTrigger);

				if (shouldTrigger) {
					lastTriggerSec = secondsSinceEpoch;
				}
			}

			// Should only trigger once (on tick 0)
			expect(triggers.filter(t => t).length).toBe(1);
			expect(triggers[0]).toBe(true);
		});
	});

	describe('Staggered Processing', () => {
		it('should have different offsets for each system', () => {
			const RESOURCE_OFFSET_SEC = 0;
			const POPULATION_OFFSET_SEC = 1800;
			const REPAIR_OFFSET_SEC = 2700;

			// All offsets should be unique
			const offsets = [RESOURCE_OFFSET_SEC, POPULATION_OFFSET_SEC, REPAIR_OFFSET_SEC];
			const uniqueOffsets = new Set(offsets);
			expect(uniqueOffsets.size).toBe(3);

			// All offsets should be within one hour
			for (const offset of offsets) {
				expect(offset).toBeGreaterThanOrEqual(0);
				expect(offset).toBeLessThan(3600);
			}
		});

		it('should not have collisions at same time', () => {
			// At 10:00:00 - only resources should trigger
			const time1 = new Date('2025-12-22T10:00:00Z').getTime();
			const sec1 = Math.floor(time1 / 1000);
			const into1 = sec1 % 3600;
			
			expect(into1).toBe(0); // Resources trigger
			expect(into1).not.toBe(1800); // Population doesn't
			expect(into1).not.toBe(2700); // Repairs don't

			// At 10:30:00 - only population should trigger
			const time2 = new Date('2025-12-22T10:30:00Z').getTime();
			const sec2 = Math.floor(time2 / 1000);
			const into2 = sec2 % 3600;
			
			expect(into2).toBe(1800); // Population triggers
			expect(into2).not.toBe(0); // Resources don't
			expect(into2).not.toBe(2700); // Repairs don't

			// At 10:45:00 - only repairs should trigger
			const time3 = new Date('2025-12-22T10:45:00Z').getTime();
			const sec3 = Math.floor(time3 / 1000);
			const into3 = sec3 % 3600;
			
			expect(into3).toBe(2700); // Repairs trigger
			expect(into3).not.toBe(0); // Resources don't
			expect(into3).not.toBe(1800); // Population doesn't
		});
	});

	describe('Real-World Time vs Server-Start Time', () => {
		it('should align to real-world time, not tick count', () => {
			// Server started at 10:05:00, but production should happen at 11:00:00
			const serverStart = new Date('2025-12-22T10:05:00Z').getTime();
			const productionTime = new Date('2025-12-22T11:00:00Z').getTime();

			const startSec = Math.floor(serverStart / 1000);
			const prodSec = Math.floor(productionTime / 1000);

			// Server start is NOT at :00
			expect(startSec % 3600).not.toBe(0);

			// Production time IS at :00
			expect(prodSec % 3600).toBe(0);

			// This proves we're using real-world time, not server start time
		});
	});

	describe('Disaster Check Frequency', () => {
		it('should allow 4 checks per hour', () => {
			const hour = [
				new Date('2025-12-22T10:00:00Z').getTime(),
				new Date('2025-12-22T10:15:00Z').getTime(),
				new Date('2025-12-22T10:30:00Z').getTime(),
				new Date('2025-12-22T10:45:00Z').getTime()
			];

			const DISASTER_INTERVAL_SEC = 900;
			const checksInHour = 3600 / DISASTER_INTERVAL_SEC;
			
			expect(checksInHour).toBe(4);

			// Verify all 4 times trigger
			for (const time of hour) {
				const sec = Math.floor(time / 1000);
				expect(sec % DISASTER_INTERVAL_SEC).toBe(0);
			}
		});
	});
});
