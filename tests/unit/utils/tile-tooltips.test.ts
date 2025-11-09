import { describe, it, expect } from 'vitest';
import {
	getAdminTileTooltip,
	getPlayerTileTooltip,
	getTileTooltip
} from '../../../src/lib/utils/tile-tooltips';

// Mock data helpers
function createMockTile(overrides = {}) {
	return {
		Biome: { name: 'Grassland' },
		type: 'land',
		elevation: 0.25,
		precipitation: 0.6,
		temperature: 0.7,
		Plots: [],
		...overrides
	};
}

function createMockPlot(hasSettlement = false, playerProfileId = 'player1', settlementName = 'TestTown') {
	return {
		Settlement: hasSettlement ? { playerProfileId, name: settlementName } : undefined
	};
}

describe('tile-tooltips', () => {
	describe('getAdminTileTooltip', () => {
		it('should return admin tooltip with all raw values', () => {
			const tile = createMockTile({
				Biome: { name: 'Forest' },
				type: 'land',
				elevation: 0.123,
				precipitation: 0.456,
				temperature: 0.789
			});

			const tooltip = getAdminTileTooltip(tile);

			expect(tooltip).toContain('Biome: Forest');
			expect(tooltip).toContain('Type: land');
			expect(tooltip).toContain('Elevation: 0.123');
			expect(tooltip).toContain('Precipitation: 0.456');
			expect(tooltip).toContain('Temperature: 0.789');
		});

		it('should format numbers with 3 decimal places', () => {
			const tile = createMockTile({
				elevation: 0.1234567,
				precipitation: 0.9876543,
				temperature: 0.5555555
			});

			const tooltip = getAdminTileTooltip(tile);

			expect(tooltip).toContain('0.123');
			expect(tooltip).toContain('0.988');
			expect(tooltip).toContain('0.556');
		});

		it('should handle negative elevation', () => {
			const tile = createMockTile({
				elevation: -0.456
			});

			const tooltip = getAdminTileTooltip(tile);

			expect(tooltip).toContain('Elevation: -0.456');
		});

		it('should handle ocean type tiles', () => {
			const tile = createMockTile({
				Biome: { name: 'Ocean' },
				type: 'ocean',
				elevation: -0.8
			});

			const tooltip = getAdminTileTooltip(tile);

			expect(tooltip).toContain('Biome: Ocean');
			expect(tooltip).toContain('Type: ocean');
			expect(tooltip).toContain('Elevation: -0.800');
		});

		it('should handle zero values', () => {
			const tile = createMockTile({
				elevation: 0,
				precipitation: 0,
				temperature: 0
			});

			const tooltip = getAdminTileTooltip(tile);

			expect(tooltip).toContain('Elevation: 0.000');
			expect(tooltip).toContain('Precipitation: 0.000');
			expect(tooltip).toContain('Temperature: 0.000');
		});
	});

	describe('getPlayerTileTooltip', () => {
		it('should return player tooltip with user-friendly formatting', () => {
			const tile = createMockTile({
				Biome: { name: 'Desert' },
				elevation: 0.25,
				Plots: [createMockPlot(), createMockPlot()]
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).toContain('Desert');
			expect(tooltip).toContain('Elevation: 25.0%');
			expect(tooltip).toContain('2 Plots');
		});

		it('should convert elevation to percentage', () => {
			const tile = createMockTile({
				elevation: 0.42
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).toContain('Elevation: 42.0%');
		});

		it('should handle singular plot count', () => {
			const tile = createMockTile({
				Plots: [createMockPlot()]
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).toContain('1 Plot');
			expect(tooltip).not.toContain('Plots');
		});

		it('should handle zero plots', () => {
			const tile = createMockTile({
				Plots: []
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).not.toContain('Plot');
		});

		it('should handle multiple plots', () => {
			const tile = createMockTile({
				Plots: [createMockPlot(), createMockPlot(), createMockPlot()]
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).toContain('3 Plots');
		});

		it('should not show settlements when playerProfileId is not provided', () => {
			const tile = createMockTile({
				Plots: [
					createMockPlot(true, 'player1', 'Settlement1'),
					createMockPlot(true, 'player1', 'Settlement2')
				]
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).not.toContain('🏘️');
			expect(tooltip).not.toContain('Settlement1');
			expect(tooltip).not.toContain('Settlement2');
		});

		it('should show player settlements when playerProfileId is provided', () => {
			const tile = createMockTile({
				Plots: [
					createMockPlot(true, 'player1', 'MyTown'),
					createMockPlot(true, 'player2', 'OtherTown')
				]
			});

			const tooltip = getPlayerTileTooltip(tile, 'player1');

			expect(tooltip).toContain('🏘️');
			expect(tooltip).toContain('MyTown');
			expect(tooltip).not.toContain('OtherTown');
		});

		it('should show multiple player settlements', () => {
			const tile = createMockTile({
				Plots: [
					createMockPlot(true, 'player1', 'TownA'),
					createMockPlot(true, 'player1', 'TownB'),
					createMockPlot(true, 'player1', 'TownC')
				]
			});

			const tooltip = getPlayerTileTooltip(tile, 'player1');

			expect(tooltip).toContain('🏘️');
			expect(tooltip).toContain('TownA, TownB, TownC');
		});

		it('should filter out plots without settlements', () => {
			const tile = createMockTile({
				Plots: [
					createMockPlot(true, 'player1', 'MySettlement'),
					createMockPlot(false),
					createMockPlot(false)
				]
			});

			const tooltip = getPlayerTileTooltip(tile, 'player1');

			expect(tooltip).toContain('MySettlement');
			expect(tooltip).not.toContain(', ,');
		});

		it('should handle settlements with null/undefined names', () => {
			const tile = createMockTile({
				Plots: [
					{ Settlement: { playerProfileId: 'player1', name: 'ValidTown' } },
					{ Settlement: { playerProfileId: 'player1', name: undefined } },
					{ Settlement: { playerProfileId: 'player1', name: null } },
					{ Settlement: { playerProfileId: 'player1', name: '' } }
				]
			});

			const tooltip = getPlayerTileTooltip(tile, 'player1');

			expect(tooltip).toContain('ValidTown');
			expect(tooltip).not.toContain('undefined');
			expect(tooltip).not.toContain('null');
			expect(tooltip).toMatch(/🏘️ ValidTown$/m);
		});

		it('should not show settlement section when player has no settlements', () => {
			const tile = createMockTile({
				Plots: [
					createMockPlot(true, 'player2', 'OtherTown'),
					createMockPlot(false)
				]
			});

			const tooltip = getPlayerTileTooltip(tile, 'player1');

			expect(tooltip).not.toContain('🏘️');
			expect(tooltip).not.toContain('OtherTown');
		});

		it('should handle negative elevation (ocean)', () => {
			const tile = createMockTile({
				Biome: { name: 'Ocean' },
				elevation: -0.5
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).toContain('Elevation: -50.0%');
		});

		it('should handle 100% elevation', () => {
			const tile = createMockTile({
				elevation: 1
			});

			const tooltip = getPlayerTileTooltip(tile);

			expect(tooltip).toContain('Elevation: 100.0%');
		});
	});

	describe('getTileTooltip', () => {
		it('should return admin tooltip when mode is "admin"', () => {
			const tile = createMockTile({
				elevation: 0.123,
				precipitation: 0.456
			});

			const tooltip = getTileTooltip(tile, 'admin');

			expect(tooltip).toContain('Elevation: 0.123');
			expect(tooltip).toContain('Precipitation: 0.456');
			expect(tooltip).not.toContain('%');
		});

		it('should return player tooltip when mode is not "admin"', () => {
			const tile = createMockTile({
				elevation: 0.42
			});

			const tooltip = getTileTooltip(tile, 'player');

			expect(tooltip).toContain('Elevation: 42.0%');
			expect(tooltip).not.toContain('0.42');
		});

		it('should pass playerProfileId to player tooltip', () => {
			const tile = createMockTile({
				Plots: [createMockPlot(true, 'player1', 'MySettlement')]
			});

			const tooltip = getTileTooltip(tile, 'player', 'player1');

			expect(tooltip).toContain('MySettlement');
		});

		it('should not include playerProfileId in admin tooltip', () => {
			const tile = createMockTile({
				Plots: [createMockPlot(true, 'player1', 'MySettlement')]
			});

			const tooltip = getTileTooltip(tile, 'admin', 'player1');

			expect(tooltip).not.toContain('🏘️');
			expect(tooltip).not.toContain('MySettlement');
		});

		it('should handle undefined playerProfileId', () => {
			const tile = createMockTile({
				Plots: [createMockPlot(true, 'player1', 'MySettlement')]
			});

			const tooltip = getTileTooltip(tile, 'player');

			expect(tooltip).not.toContain('MySettlement');
		});
	});
});
