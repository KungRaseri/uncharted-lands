import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import ExtractorBuildModal from '$lib/components/resources/ExtractorBuildModal.svelte';
import type { TileWithRelations } from '$lib/types/api';
import * as resourceUtils from '$lib/utils/resource-production';

// Mock the resource-production utilities
vi.mock('$lib/utils/resource-production', () => ({
	getResourceIcon: vi.fn(),
	getResourceName: vi.fn(),
	getExtractorName: vi.fn(),
	getQualityInfo: vi.fn()
}));

describe('ExtractorBuildModal.svelte', () => {
	const baseTile: TileWithRelations = {
		id: 'tile1',
		regionId: 'region1',
		biomeId: 'biome1',
		xCoord: 10,
		yCoord: 20,
		x: 10, // Legacy field for compatibility
		y: 20, // Legacy field for compatibility
		elevation: 100,
		temperature: 50,
		precipitation: 30,
		type: 'LAND',
		foodQuality: 60,
		woodQuality: 80,
		stoneQuality: 40,
		oreQuality: 50,
		settlementId: null,
		plotSlots: 5,
		baseProductionModifier: 1.0,
		specialResource: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		structures: [] // Empty array for available slots calculation
	};

	let onCloseMock: ReturnType<typeof vi.fn<() => void>>;
	let onBuildExtractorMock: ReturnType<
		typeof vi.fn<(tileId: string, slotPosition: number, extractorType: string) => Promise<void>>
	>;

	// Helper to get the Build Extractor button (not the header)
	const getBuildButton = () => {
		const buttons = screen.getAllByText('Build Extractor');
		// Find the one that's actually a button (the last one in DOM order)
		return buttons[buttons.length - 1].closest('button') as HTMLButtonElement;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		onCloseMock = vi.fn<() => void>();
		onBuildExtractorMock = vi
			.fn<(tileId: string, slotPosition: number, extractorType: string) => Promise<void>>()
			.mockResolvedValue(undefined);

		// Setup default mocks
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(resourceUtils.getResourceIcon as any).mockImplementation(async (type: string) => {
			const icons: Record<string, string> = {
				FOOD: '🌾',
				WATER: '💧',
				WOOD: '🪵',
				STONE: '🪨',
				ORE: '⛏️'
			};
			return icons[type] || '?';
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(resourceUtils.getResourceName as any).mockImplementation(async (type: string) => {
			const names: Record<string, string> = {
				FOOD: 'Food',
				WATER: 'Water',
				WOOD: 'Wood',
				STONE: 'Stone',
				ORE: 'Ore'
			};
			return names[type] || type;
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(resourceUtils.getExtractorName as any).mockImplementation(async (type: string) => {
			const names: Record<string, string> = {
				BASIC_FARM: 'Basic Farm',
				ADVANCED_FARM: 'Advanced Farm',
				BASIC_WELL: 'Basic Well',
				BASIC_LUMBER_MILL: 'Basic Lumber Mill',
				BASIC_QUARRY: 'Basic Quarry',
				BASIC_MINE: 'Basic Mine'
			};
			return names[type] || type;
		});
	});

	describe('Modal Visibility', () => {
		it('should not render when isOpen is false', () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: false,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			expect(() => screen.getByRole('dialog')).toThrow();
		});

		it('should render when isOpen is true', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const buildTexts = screen.getAllByText('Build Extractor');
				expect(buildTexts.length).toBeGreaterThanOrEqual(1); // Appears in header and button
			});
		});
	});

	describe('Modal Header', () => {
		it('should display modal title', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const titles = screen.getAllByText('Build Extractor');
				expect(titles.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should display plot coordinates', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Tile at \(10, 20\)/)).toBeDefined();
			});
		});

		it('should display plot area', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/plotSlots: 5/)).toBeDefined();
			});
		});

		it('should display close button', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Close');
				expect(closeButton).toBeDefined();
			});
		});

		it('should call onClose when close button is clicked', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Close');
				fireEvent.click(closeButton);
			});

			expect(onCloseMock).toHaveBeenCalledOnce();
		});
	});

	describe('Tile Resources Display', () => {
		it('should display Tile Resources section', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Tile Resources')).toBeDefined();
			});
		});

		it('should display food resource', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const foodIcons = screen.getAllByText('🌾');
				expect(foodIcons.length).toBeGreaterThanOrEqual(1);
				expect(screen.getByText(/Food: 60/)).toBeDefined();
			});
		});

		it('should display water resource', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const waterIcons = screen.getAllByText('💧');
				expect(waterIcons.length).toBeGreaterThanOrEqual(1);
				expect(screen.getByText(/Water: 50/)).toBeDefined();
			});
		});

		it('should display wood resource', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const woodIcons = screen.getAllByText('🪵');
				expect(woodIcons.length).toBeGreaterThanOrEqual(1);
				expect(screen.getByText(/Wood: 80/)).toBeDefined();
			});
		});

		it('should display stone resource', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const stoneIcons = screen.getAllByText('🪨');
				expect(stoneIcons.length).toBeGreaterThanOrEqual(1);
				expect(screen.getByText(/Stone: 40/)).toBeDefined();
			});
		});

		it('should display ore resource', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const oreIcons = screen.getAllByText('⛏️');
				expect(oreIcons.length).toBeGreaterThanOrEqual(1);
				expect(screen.getByText(/Ore: 50/)).toBeDefined();
			});
		});

		it('should only display resources with value > 0', async () => {
			const tileWithNoFood = { ...baseTile, foodQuality: 0 };
			render(ExtractorBuildModal, {
				props: {
					tile: tileWithNoFood,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Tile Resources')).toBeDefined();
				expect(() => screen.getByText(/Food:/)).toThrow();
			});
		});
	});

	describe('Extractor Options', () => {
		it('should display extractor selection section', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Select Extractor Type')).toBeDefined();
			});
		});

		it('should display basic farm option when food > 0', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Farm')).toBeDefined();
				const producesFood = screen.getAllByText(/Produces Food/);
				expect(producesFood.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should display advanced farm option when food >= 50', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: { ...baseTile, foodQuality: 60 },
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Advanced Farm')).toBeDefined();
			});
		});

		it('should not display advanced farm when food < 50', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: { ...baseTile, foodQuality: 40 },
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Farm')).toBeDefined();
			});

			expect(() => screen.getByText('Advanced Farm')).toThrow();
		});

		it('should display basic well option when water > 0', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Well')).toBeDefined();
				const producesWater = screen.getAllByText(/Produces Water/);
				expect(producesWater.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should display basic lumber mill option when wood > 0', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Lumber Mill')).toBeDefined();
				const producesWood = screen.getAllByText(/Produces Wood/);
				expect(producesWood.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should display basic quarry option when stone > 0', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Quarry')).toBeDefined();
				const producesStone = screen.getAllByText(/Produces Stone/);
				expect(producesStone.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should display basic mine option when ore > 0', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Mine')).toBeDefined();
				const producesOre = screen.getAllByText(/Produces Ore/);
				expect(producesOre.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should display disabled farm with reason when food = 0', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: { ...baseTile, foodQuality: 0 },
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Basic Farm')).toBeDefined();
				expect(screen.getByText('Insufficient food quality on this plot')).toBeDefined();
			});
		});
	});

	describe('Extractor Selection', () => {
		it('should allow selecting an available extractor', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				expect(farmButton).toBeDefined();
				await fireEvent.click(farmButton!);
			});

			await waitFor(() => {
				const checkmark = screen.getByText('✓');
				expect(checkmark).toBeDefined();
			});
		});

		it('should not allow selecting disabled extractors', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: { ...baseTile, foodQuality: 0 },
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const farmButton = screen.getByText('Basic Farm').closest('button') as HTMLButtonElement;
				expect(farmButton.disabled).toBe(true);
			});
		});
	});

	describe('Build Cost Display', () => {
		it('should display build cost when extractor is selected', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(() => {
				expect(screen.getByText('Build Cost')).toBeDefined();
			});
		});

		it('should display basic extractor costs correctly', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(() => {
				expect(screen.getByText('100')).toBeDefined(); // Wood
				expect(screen.getByText('75')).toBeDefined(); // Stone
				expect(screen.getByText('50')).toBeDefined(); // Ore
			});
		});

		it('should display advanced extractor costs correctly', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: { ...baseTile, foodQuality: 60 },
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Advanced Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(() => {
				expect(screen.getByText('200')).toBeDefined(); // Wood
				expect(screen.getByText('150')).toBeDefined(); // Stone
			});
		});

		it('should not display cost when no extractor selected', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Select Extractor Type')).toBeDefined();
			});

			expect(() => screen.getByText('Build Cost')).toThrow();
		});
	});

	describe('Form Actions', () => {
		it('should display Cancel button', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Cancel')).toBeDefined();
			});
		});

		it('should display Build Extractor button', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const buildButtons = screen.getAllByText('Build Extractor');
				expect(buildButtons.length).toBeGreaterThanOrEqual(1); // Header and button
			});
		});

		it('should call onClose when Cancel button is clicked', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const cancelButton = screen.getByText('Cancel');
				fireEvent.click(cancelButton);
			});

			expect(onCloseMock).toHaveBeenCalledOnce();
		});

		it('should disable Build button when no extractor selected', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				const buildButton = getBuildButton();
				expect(buildButton.disabled).toBe(true);
			});
		});

		it('should enable Build button when extractor is selected', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(() => {
				const buildButton = getBuildButton();
				expect(buildButton.disabled).toBe(false);
			});
		});
	});

	describe('Building Process', () => {
		it('should call onBuildExtractor with correct parameters', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(onBuildExtractorMock).toHaveBeenCalledOnce();
				expect(onBuildExtractorMock).toHaveBeenCalledWith('tile1', 1, 'BASIC_FARM');
			});
		});

		it('should close modal after successful build', async () => {
			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(onCloseMock).toHaveBeenCalledOnce();
			});
		});

		it('should display loading state during build', async () => {
			onBuildExtractorMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(screen.getByText('Building...')).toBeDefined();
			});
		});

		it('should disable buttons during build', async () => {
			onBuildExtractorMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Close') as HTMLButtonElement;
				expect(closeButton.disabled).toBe(true);
			});
		});

		it('should display error message on build failure', async () => {
			onBuildExtractorMock.mockRejectedValue(new Error('Insufficient resources'));

			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(screen.getByText(/⚠️ Insufficient resources/)).toBeDefined();
			});
		});

		it('should not close modal on build failure', async () => {
			onBuildExtractorMock.mockRejectedValue(new Error('Failed'));

			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(screen.getByText(/⚠️ Failed/)).toBeDefined();
			});

			expect(onCloseMock).not.toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle plot with all zero resources', async () => {
			const emptyTile = {
				...baseTile,
				foodQuality: 0,
				woodQuality: 0,
				stoneQuality: 0,
				oreQuality: 0
			};

			render(ExtractorBuildModal, {
				props: {
					tile: emptyTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Tile Resources')).toBeDefined();
				// Should show disabled farm
				expect(screen.getByText('Insufficient food quality on this plot')).toBeDefined();
			});
		});

		it('should reset selection when modal reopens', async () => {
			const { rerender } = render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			// Select an extractor
			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(() => {
				expect(screen.getByText('Build Cost')).toBeDefined();
			});

			// Close and reopen
			rerender({
				tile: baseTile,
				isOpen: false,
				onClose: onCloseMock,
				onBuildExtractor: onBuildExtractorMock
			});

			rerender({
				tile: baseTile,
				isOpen: true,
				onClose: onCloseMock,
				onBuildExtractor: onBuildExtractorMock
			});

			await waitFor(() => {
				expect(() => screen.getByText('Build Cost')).toThrow();
			});
		});

		it('should handle generic error objects', async () => {
			onBuildExtractorMock.mockRejectedValue('String error');

			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(screen.getByText(/⚠️ Failed to build extractor/)).toBeDefined();
			});
		});

		it('should prevent closing during build', async () => {
			onBuildExtractorMock.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(ExtractorBuildModal, {
				props: {
					tile: baseTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(async () => {
				const farmButton = screen.getByText('Basic Farm').closest('button');
				await fireEvent.click(farmButton!);
			});

			await waitFor(async () => {
				const buildButton = getBuildButton();
				await fireEvent.click(buildButton!);
			});

			await waitFor(() => {
				expect(screen.getByText('Building...')).toBeDefined();
			});

			const closeButton = screen.getByLabelText('Close') as HTMLButtonElement;
			expect(closeButton.disabled).toBe(true);
		});

		it('should handle high resource values', async () => {
			const highResourceTile = {
				...baseTile,
				foodQuality: 999,
				woodQuality: 999,
				stoneQuality: 999,
				oreQuality: 999
			};

			render(ExtractorBuildModal, {
				props: {
					tile: highResourceTile,
					isOpen: true,
					onClose: onCloseMock,
					onBuildExtractor: onBuildExtractorMock
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/foodQuality: 999/)).toBeDefined();
			});
		});
	});
});
