import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import PlotCreationModal from '$lib/components/resources/PlotCreationModal.svelte';
import type { Tile, Biome } from '$lib/types/game';
import type { CreatePlotRequest } from '$lib/types/api';
import * as resourceUtils from '$lib/utils/resource-production';

// Mock the resource-production utilities
vi.mock('$lib/utils/resource-production', () => ({
	getResourceIcon: vi.fn(),
	getQualityInfo: vi.fn()
}));

describe('PlotCreationModal.svelte', () => {
	const baseBiome: Biome = {
		id: 'biome1',
		name: 'Forest',
		precipitationMin: 0,
		precipitationMax: 100,
		temperatureMin: 0,
		temperatureMax: 100,
		plotsMin: 1,
		plotsMax: 5,
		plotAreaMin: 1,
		plotAreaMax: 10,
		solarModifier: 1,
		windModifier: 1,
		foodModifier: 1,
		waterModifier: 1,
		woodModifier: 1,
		stoneModifier: 1,
		oreModifier: 1
	};

	const baseTile: Tile = {
		id: 'tile1',
		biomeId: 'biome1',
		regionId: 'region1',
		elevation: 50,
		temperature: 20,
		precipitation: 50,
		type: 'LAND',
		foodQuality: 60,
		woodQuality: 80,
		stoneQuality: 40,
		oreQuality: 50,
		plotSlots: 3,
		specialResource: null,
		Biome: baseBiome
	} as Tile;

	let onCloseMock: ReturnType<typeof vi.fn<() => void>>;
	let onCreatePlotMock: ReturnType<typeof vi.fn<(plotData: CreatePlotRequest) => Promise<void>>>;

	beforeEach(() => {
		vi.clearAllMocks();
		onCloseMock = vi.fn<() => void>();
		onCreatePlotMock = vi.fn<(plotData: CreatePlotRequest) => Promise<void>>().mockResolvedValue(undefined);

		// Setup default mocks for TileResourceInfo
		(resourceUtils.getResourceIcon as any).mockImplementation(async (type: string) => {
			const icons: Record<string, string> = {
				FOOD: '🌾',
				WOOD: '🪵',
				STONE: '🪨',
				ORE: '⛏️'
			};
			return icons[type] || '?';
		});

		(resourceUtils.getQualityInfo as any).mockImplementation(async (quality: number) => {
			if (quality >= 80) return { rating: 'Excellent', color: 'text-success-500', multiplier: 1.5 };
			if (quality >= 60) return { rating: 'Good', color: 'text-primary-500', multiplier: 1.25 };
			if (quality >= 40) return { rating: 'Fair', color: 'text-warning-500', multiplier: 1 };
			return { rating: 'Poor', color: 'text-error-500', multiplier: 0.75 };
		});
	});

	describe('Modal Visibility', () => {
		it('should not render when isOpen is false', () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: false,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			expect(() => screen.getByText('Create New Plot')).toThrow();
		});

		it('should render when isOpen is true', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Create New Plot')).toBeDefined();
			});
		});

		it('should not render when tile is null', () => {
			render(PlotCreationModal, {
				props: {
					tile: null,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			expect(() => screen.getByText('Create New Plot')).toThrow();
		});
	});

	describe('Modal Header', () => {
		it('should display modal title', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Create New Plot')).toBeDefined();
			});
		});

		it('should display close button', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Close');
				expect(closeButton).toBeDefined();
			});
		});

		it('should call onClose when close button is clicked', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Close');
				fireEvent.click(closeButton);
			});

			expect(onCloseMock).toHaveBeenCalledOnce();
		});
	});

	describe('Tile Information Display', () => {
		it('should display tile information section', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Tile Information')).toBeDefined();
				expect(screen.getByText('Resource Quality')).toBeDefined();
			});
		});

		it('should render TileResourceInfo component', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Food')).toBeDefined();
				expect(screen.getByText('Wood')).toBeDefined();
			});
		});
	});

	describe('Form Inputs', () => {
		it('should display X coordinate input', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('X Coordinate')).toBeDefined();
				const xInput = screen.getByLabelText('X Coordinate') as HTMLInputElement;
				expect(xInput.type).toBe('number');
			});
		});

		it('should display Y coordinate input', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Y Coordinate')).toBeDefined();
				const yInput = screen.getByLabelText('Y Coordinate') as HTMLInputElement;
				expect(yInput.type).toBe('number');
			});
		});

		it('should display plot area range input', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Plot Area (units)')).toBeDefined();
				const inputs = document.querySelectorAll('input[type="range"]');
				expect(inputs.length).toBeGreaterThan(0);
			});
		});

		it('should initialize X coordinate to 0', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				const xInput = screen.getByLabelText('X Coordinate') as HTMLInputElement;
				expect(xInput.value).toBe('0');
			});
		});

		it('should initialize Y coordinate to 0', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				const yInput = screen.getByLabelText('Y Coordinate') as HTMLInputElement;
				expect(yInput.value).toBe('0');
			});
		});

		it('should initialize area to 100', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				const areaInput = document.querySelector('input[type="range"]') as HTMLInputElement;
				expect(areaInput.value).toBe('100');
			});
		});

		it('should display current area value', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('100 units (affects resource production)')).toBeDefined();
			});
		});
	});

	describe('Expected Resource Production', () => {
		it('should display expected resource production section', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Expected Resource Production')).toBeDefined();
			});
		});

		it('should calculate and display food production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// (60 / 100) * 100 = 60
				expect(screen.getByText(/🌾 Food: 60\/day/)).toBeDefined();
			});
		});

		it('should calculate and display wood production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// (80 / 100) * 100 = 80
				expect(screen.getByText(/🪵 Wood: 80\/day/)).toBeDefined();
			});
		});

		it('should calculate and display stone production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// (40 / 100) * 100 = 40
				expect(screen.getByText(/🪨 Stone: 40\/day/)).toBeDefined();
			});
		});

		it('should calculate and display ore production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// (50 / 100) * 100 = 50
				expect(screen.getByText(/⛏️ Ore: 50\/day/)).toBeDefined();
			});
		});

		it('should calculate and display water production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// 100 * 0.5 = 50
				expect(screen.getByText(/💧 Water: 50\/day/)).toBeDefined();
			});
		});

		it('should calculate and display solar production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// (100 / 100) * 50 = 50
				expect(screen.getByText(/☀️ Solar: 50/)).toBeDefined();
			});
		});

		it('should calculate and display wind production', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				// (100 / 100) * 30 = 30
				expect(screen.getByText(/💨 Wind: 30/)).toBeDefined();
			});
		});

		it('should only show resources with production > 0', async () => {
			const tileWithNoFood = { ...baseTile, foodQuality: 0 } as Tile;
			render(PlotCreationModal, {
				props: {
					tile: tileWithNoFood,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(() => screen.getByText(/🌾 Food:/)).toThrow();
				expect(screen.getByText(/💧 Water:/)).toBeDefined(); // Water should still show
			});
		});

		it('should display disclaimer about estimates', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Production rates are estimates based on tile quality/)).toBeDefined();
			});
		});
	});

	describe('Form Actions', () => {
		it('should display Cancel button', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Cancel')).toBeDefined();
			});
		});

		it('should display Create Plot button', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Create Plot')).toBeDefined();
			});
		});

		it('should call onClose when Cancel button is clicked', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				const cancelButton = screen.getByText('Cancel');
				fireEvent.click(cancelButton);
			});

			expect(onCloseMock).toHaveBeenCalledOnce();
		});
	});

	describe('Form Submission', () => {
		it('should call onCreatePlot with correct data', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(onCreatePlotMock).toHaveBeenCalledOnce();
				const callArgs = onCreatePlotMock.mock.calls[0][0];
				expect(callArgs.tileId).toBe('tile1');
				expect(callArgs.x).toBe(0);
				expect(callArgs.y).toBe(0);
				expect(callArgs.area).toBe(100);
				expect(callArgs.food).toBe(60);
				expect(callArgs.wood).toBe(80);
				expect(callArgs.stone).toBe(40);
				expect(callArgs.ore).toBe(50);
				expect(callArgs.water).toBe(50);
				expect(callArgs.solar).toBe(50);
				expect(callArgs.wind).toBe(30);
			});
		});

		it('should close modal after successful creation', async () => {
			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(onCloseMock).toHaveBeenCalledOnce();
			});
		});

		it('should display loading state during creation', async () => {
			onCreatePlotMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(screen.getByText('Creating...')).toBeDefined();
			});
		});

		it('should disable inputs during creation', async () => {
			onCreatePlotMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				const xInput = screen.getByLabelText('X Coordinate') as HTMLInputElement;
				expect(xInput.disabled).toBe(true);
			});
		});

		it('should disable buttons during creation', async () => {
			onCreatePlotMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Close') as HTMLButtonElement;
				expect(closeButton.disabled).toBe(true);
			});
		});

		it('should display error message on creation failure', async () => {
			onCreatePlotMock.mockRejectedValue(new Error('Network error'));

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(screen.getByText(/⚠️ Network error/)).toBeDefined();
			});
		});

		it('should not close modal on creation failure', async () => {
			onCreatePlotMock.mockRejectedValue(new Error('Failed'));

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(screen.getByText(/⚠️ Failed/)).toBeDefined();
			});

			expect(onCloseMock).not.toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle tile with zero resource qualities', async () => {
			const zeroTile = {
				...baseTile,
				foodQuality: 0,
				woodQuality: 0,
				stoneQuality: 0,
				oreQuality: 0
			} as Tile;

			render(PlotCreationModal, {
				props: {
					tile: zeroTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Expected Resource Production')).toBeDefined();
				// Should still show water, solar, and wind
				expect(screen.getByText(/💧 Water:/)).toBeDefined();
				expect(screen.getByText(/☀️ Solar:/)).toBeDefined();
				expect(screen.getByText(/💨 Wind:/)).toBeDefined();
			});
		});

		it('should handle tile with null resource qualities', async () => {
			const nullTile = {
				...baseTile,
				foodQuality: null,
				woodQuality: null,
				stoneQuality: null,
				oreQuality: null
			} as any;

			render(PlotCreationModal, {
				props: {
					tile: nullTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Expected Resource Production')).toBeDefined();
			});
		});

		it('should handle tile with missing plotSlots', async () => {
			const noSlotsTile = { ...baseTile, plotSlots: undefined } as any;

			render(PlotCreationModal, {
				props: {
					tile: noSlotsTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Create New Plot')).toBeDefined();
			});
		});

		it('should reset form when modal reopens', async () => {
			const { rerender } = render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			// Modify inputs
			await waitFor(async () => {
				const xInput = screen.getByLabelText('X Coordinate') as HTMLInputElement;
				await fireEvent.input(xInput, { target: { value: '50' } });
			});

			// Close and reopen
			rerender({
				tile: baseTile,
				isOpen: false,
				onClose: onCloseMock,
				onCreatePlot: onCreatePlotMock
			});

			rerender({
				tile: baseTile,
				isOpen: true,
				onClose: onCloseMock,
				onCreatePlot: onCreatePlotMock
			});

			await waitFor(() => {
				const xInput = screen.getByLabelText('X Coordinate') as HTMLInputElement;
				expect(xInput.value).toBe('0');
			});
		});

		it('should handle generic error objects', async () => {
			onCreatePlotMock.mockRejectedValue('String error');

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(screen.getByText(/⚠️ Failed to create plot/)).toBeDefined();
			});
		});

		it('should prevent closing during creation', async () => {
			onCreatePlotMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(PlotCreationModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onCreatePlot: onCreatePlotMock
				}
			});

			await waitFor(async () => {
				const submitButton = screen.getByText('Create Plot');
				await fireEvent.click(submitButton);
			});

			await waitFor(() => {
				expect(screen.getByText('Creating...')).toBeDefined();
			});

			// Try to close
			const closeButton = screen.getByLabelText('Close') as HTMLButtonElement;
			expect(closeButton.disabled).toBe(true);
		});
	});
});
