import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ExtractorsGridPanel from '$lib/components/game/panels/ExtractorsGridPanel.svelte';

interface Extractor {
	id: string;
	structureId: string;
	name: string;
	description: string;
	level: number;
	maxLevel: number;
	health: number;
	tileId: string | null;
	slotPosition: number | null;
	buildingType: string | null;
}

interface Props {
	extractorsByTile: Record<string, Extractor[]>;
	totalSlotsPerTile?: number;
	settlementId: string;
	onUpgrade?: (extractorId: string) => void;
	onRepair?: (extractorId: string) => void;
	onDemolish?: (extractorId: string) => void;
}

// Mock data: Extractors grouped by tile
const mockExtractorsByTile: Record<string, Extractor[]> = {
	tile_abc123: [
		{
			id: 'ext_1',
			structureId: 'FARM',
			name: 'Farm #1',
			description: 'Produces food from crops',
			level: 1,
			maxLevel: 5,
			health: 100,
			tileId: 'tile_abc123',
			slotPosition: 0,
			buildingType: 'FARM'
		},
		{
			id: 'ext_2',
			structureId: 'WELL',
			name: 'Well #1',
			description: 'Produces water from groundwater',
			level: 2,
			maxLevel: 5,
			health: 85,
			tileId: 'tile_abc123',
			slotPosition: 1,
			buildingType: 'WELL'
		},
		{
			id: 'ext_3',
			structureId: 'LUMBER_MILL',
			name: 'Lumber Mill #1',
			description: 'Produces wood from trees',
			level: 3,
			maxLevel: 5,
			health: 65,
			tileId: 'tile_abc123',
			slotPosition: 2,
			buildingType: 'LUMBER_MILL'
		},
		{
			id: 'ext_4',
			structureId: 'QUARRY',
			name: 'Quarry #1',
			description: 'Produces stone from rock deposits',
			level: 5,
			maxLevel: 5,
			health: 42,
			tileId: 'tile_abc123',
			slotPosition: 3,
			buildingType: 'QUARRY'
		}
	],
	tile_def456: [
		{
			id: 'ext_5',
			structureId: 'MINE',
			name: 'Mine #1',
			description: 'Produces ore from mineral deposits',
			level: 1,
			maxLevel: 5,
			health: 20,
			tileId: 'tile_def456',
			slotPosition: 0,
			buildingType: 'MINE'
		},
		{
			id: 'ext_6',
			structureId: 'FARM',
			name: 'Farm #2',
			description: 'Produces food from crops',
			level: 4,
			maxLevel: 5,
			health: 0,
			tileId: 'tile_def456',
			slotPosition: 1,
			buildingType: 'FARM'
		}
	],
	tile_ghi789: [
		{
			id: 'ext_7',
			structureId: 'WELL',
			name: 'Well #2',
			description: 'Produces water from groundwater',
			level: 1,
			maxLevel: 5,
			health: 95,
			tileId: 'tile_ghi789',
			slotPosition: 0,
			buildingType: 'WELL'
		},
		{
			id: 'ext_8',
			structureId: 'LUMBER_MILL',
			name: 'Lumber Mill #2',
			description: 'Produces wood from trees',
			level: 2,
			maxLevel: 5,
			health: 78,
			tileId: 'tile_ghi789',
			slotPosition: 1,
			buildingType: 'LUMBER_MILL'
		},
		{
			id: 'ext_9',
			structureId: 'QUARRY',
			name: 'Quarry #2',
			description: 'Produces stone from rock deposits',
			level: 3,
			maxLevel: 5,
			health: 55,
			tileId: 'tile_ghi789',
			slotPosition: 2,
			buildingType: 'QUARRY'
		},
		{
			id: 'ext_10',
			structureId: 'MINE',
			name: 'Mine #2',
			description: 'Produces ore from mineral deposits',
			level: 5,
			maxLevel: 5,
			health: 33,
			tileId: 'tile_ghi789',
			slotPosition: 3,
			buildingType: 'MINE'
		},
		{
			id: 'ext_11',
			structureId: 'FARM',
			name: 'Farm #3',
			description: 'Produces food from crops',
			level: 5,
			maxLevel: 5,
			health: 12,
			tileId: 'tile_ghi789',
			slotPosition: 4,
			buildingType: 'FARM'
		}
	]
};

describe('ExtractorsGridPanel', () => {
	let defaultProps: Props;
	let onUpgradeMock: (extractorId: string) => void;
	let onRepairMock: (extractorId: string) => void;
	let onDemolishMock: (extractorId: string) => void;

	beforeEach(() => {
		onUpgradeMock = vi.fn();
		onRepairMock = vi.fn();
		onDemolishMock = vi.fn();

		defaultProps = {
			extractorsByTile: mockExtractorsByTile,
			totalSlotsPerTile: 5,
			settlementId: 'settlement_123',
			onUpgrade: onUpgradeMock,
			onRepair: onRepairMock,
			onDemolish: onDemolishMock
		};
	});

	describe('Rendering', () => {
		it('should render section header with total extractor count', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			const heading = screen.getByRole('heading', { level: 3 });
			expect(heading.textContent).toContain('Extractors');
			expect(heading.textContent).toContain('11'); // Total across all tiles
		});

		it('should display empty state when no extractors exist', () => {
			const emptyProps = { ...defaultProps, extractorsByTile: {} };
			render(ExtractorsGridPanel, { props: emptyProps });

			expect(screen.getByText(/No extractors yet/i)).toBeInTheDocument();
			expect(screen.getByText(/Build extractors on resource tiles/i)).toBeInTheDocument();
		});

		it('should group extractors by tile correctly', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Should have 3 tile sections
			const tileHeadings = screen.getAllByRole('heading', { level: 4 });
			expect(tileHeadings).toHaveLength(3);

			// Check tile IDs are displayed (truncated)
			expect(tileHeadings[0].textContent).toContain('tile_abc');
			expect(tileHeadings[1].textContent).toContain('tile_def');
			expect(tileHeadings[2].textContent).toContain('tile_ghi');
		});

		it('should render all 11 extractors across 3 tiles', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Count extractor cards by heading level 5
			const extractorHeadings = screen.getAllByRole('heading', { level: 5 });
			expect(extractorHeadings).toHaveLength(11);

			// Verify specific extractors are present
			expect(screen.getByText('Farm #1')).toBeInTheDocument();
			expect(screen.getByText('Well #1')).toBeInTheDocument();
			expect(screen.getByText('Mine #2')).toBeInTheDocument();
		});

		it('should display extractor descriptions', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			expect(screen.getByText('Produces food from crops')).toBeInTheDocument();
			expect(screen.getByText('Produces water from groundwater')).toBeInTheDocument();
			expect(screen.getByText('Produces ore from mineral deposits')).toBeInTheDocument();
		});
	});

	describe('Slot Display', () => {
		it('should display slot usage with correct format "X/Y slots used"', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// tile_abc123: 4/5 slots (80%)
			expect(screen.getByText('4/5 slots used')).toBeInTheDocument();

			// tile_def456: 2/5 slots (40%)
			expect(screen.getByText('2/5 slots used')).toBeInTheDocument();

			// tile_ghi789: 5/5 slots (100%)
			expect(screen.getByText('5/5 slots used')).toBeInTheDocument();
		});

		it('should apply green color when slots usage < 80%', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// tile_def456 has 2/5 slots (40%) - should be green
			const usageTexts = screen.getAllByText(/slots used/i);
			const tile2Usage = usageTexts.find((el) => el.textContent === '2/5 slots used');

			expect(tile2Usage).toHaveClass('text-success-500');
		});

		it('should apply yellow color when slots usage >= 80% and < 100%', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// tile_abc123 has 4/5 slots (80%) - should be yellow
			const usageTexts = screen.getAllByText(/slots used/i);
			const tile1Usage = usageTexts.find((el) => el.textContent === '4/5 slots used');

			expect(tile1Usage).toHaveClass('text-warning-500');
		});

		it('should apply red color when slots usage = 100%', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// tile_ghi789 has 5/5 slots (100%) - should be red
			const usageTexts = screen.getAllByText(/slots used/i);
			const tile3Usage = usageTexts.find((el) => el.textContent === '5/5 slots used');

			expect(tile3Usage).toHaveClass('text-error-500');
		});

		it('should display available slots count', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// tile_abc123: 1 available (5 - 4)
			expect(screen.getByText('1 available')).toBeInTheDocument();

			// tile_def456: 3 available (5 - 2)
			expect(screen.getByText('3 available')).toBeInTheDocument();

			// tile_ghi789: 0 available (5 - 5)
			expect(screen.getByText('0 available')).toBeInTheDocument();
		});

		it('should display slot position in extractor card', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Check slot positions are displayed
			expect(screen.getByText(/Slot 0/i)).toBeInTheDocument();
			expect(screen.getByText(/Slot 1/i)).toBeInTheDocument();
			expect(screen.getByText(/Slot 4/i)).toBeInTheDocument();
		});
	});

	describe('Health Display', () => {
		it('should render health bars with correct width percentages', () => {
			const { container } = render(ExtractorsGridPanel, { props: defaultProps });

			// Find health bars by progressbar role
			const progressBars = container.querySelectorAll('[role="progressbar"]');
			expect(progressBars.length).toBeGreaterThan(0);

			// Check specific health percentages
			// Farm #1: 100% health
			const farm1Bar = Array.from(progressBars).find(
				(bar) => bar.getAttribute('aria-valuenow') === '100'
			);
			expect(farm1Bar).toBeDefined();
			expect(farm1Bar?.querySelector('.bg-success-500')).toBeDefined();

			// Well #1: 85% health
			const well1Bar = Array.from(progressBars).find(
				(bar) => bar.getAttribute('aria-valuenow') === '85'
			);
			expect(well1Bar).toBeDefined();

			// Lumber Mill #1: 65% health
			const lumber1Bar = Array.from(progressBars).find(
				(bar) => bar.getAttribute('aria-valuenow') === '65'
			);
			expect(lumber1Bar).toBeDefined();
		});

		it('should apply correct health color based on thresholds', () => {
			const { container } = render(ExtractorsGridPanel, { props: defaultProps });

			const progressBars = container.querySelectorAll('[role="progressbar"]');

			// >= 80%: success-500 (green)
			const highHealthBars = Array.from(progressBars).filter((bar) => {
				const value = parseInt(bar.getAttribute('aria-valuenow') || '0');
				return value >= 80;
			});
			highHealthBars.forEach((bar) => {
				expect(bar.querySelector('.bg-success-500')).toBeDefined();
			});

			// >= 60% and < 80%: warning-500 (yellow)
			const medHealthBars = Array.from(progressBars).filter((bar) => {
				const value = parseInt(bar.getAttribute('aria-valuenow') || '0');
				return value >= 60 && value < 80;
			});
			medHealthBars.forEach((bar) => {
				expect(bar.querySelector('.bg-warning-500')).toBeDefined();
			});

			// >= 40% and < 60%: warning-700 (orange)
			const lowHealthBars = Array.from(progressBars).filter((bar) => {
				const value = parseInt(bar.getAttribute('aria-valuenow') || '0');
				return value >= 40 && value < 60;
			});
			lowHealthBars.forEach((bar) => {
				expect(bar.querySelector('.bg-warning-700')).toBeDefined();
			});

			// < 40%: error-500 (red)
			const criticalBars = Array.from(progressBars).filter((bar) => {
				const value = parseInt(bar.getAttribute('aria-valuenow') || '0');
				return value > 0 && value < 40;
			});
			criticalBars.forEach((bar) => {
				expect(bar.querySelector('.bg-error-500')).toBeDefined();
			});
		});

		it('should display correct health labels', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Health 100%: Pristine
			expect(screen.getAllByText('Pristine').length).toBeGreaterThan(0);

			// Health 95%: Excellent
			expect(screen.getAllByText('Excellent').length).toBeGreaterThan(0);

			// Health 85%: Excellent
			expect(screen.getAllByText('Excellent').length).toBeGreaterThan(0);

			// Health 65%: Good
			expect(screen.getAllByText('Good').length).toBeGreaterThan(0);

			// Health 42%: Damaged
			expect(screen.getAllByText('Damaged').length).toBeGreaterThan(0);

			// Health 20%: Poor
			expect(screen.getAllByText('Poor').length).toBeGreaterThan(0);

			// Health 12%: Critical
			expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);

			// Health 0%: Destroyed
			expect(screen.getAllByText('Destroyed').length).toBeGreaterThan(0);
		});

		it('should have progressbar ARIA attributes', () => {
			const { container } = render(ExtractorsGridPanel, { props: defaultProps });

			const progressBars = container.querySelectorAll('[role="progressbar"]');
			expect(progressBars.length).toBe(11);

			progressBars.forEach((bar) => {
				expect(bar.getAttribute('aria-valuemin')).toBe('0');
				expect(bar.getAttribute('aria-valuemax')).toBe('100');
				expect(bar.getAttribute('aria-valuenow')).toBeDefined();

				const value = parseInt(bar.getAttribute('aria-valuenow') || '0');
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(100);
			});
		});
	});

	describe('Action Buttons', () => {
		it('should show Upgrade button when level < maxLevel', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Farm #1: level 1/5 - should have Upgrade button
			const farm1Card = screen.getByText('Farm #1').closest('article');
			const upgradeButton = farm1Card?.querySelector('button[aria-label*="Upgrade"]');
			expect(upgradeButton).toBeInTheDocument();
		});

		it('should hide Upgrade button when level = maxLevel', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Quarry #1: level 5/5 - should NOT have Upgrade button
			const quarry1Card = screen.getByText('Quarry #1').closest('article');
			const upgradeButton = quarry1Card?.querySelector('button[aria-label*="Upgrade"]');
			expect(upgradeButton).not.toBeInTheDocument();
		});

		it('should show Repair button when health < 100%', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Well #1: health 85% - should have Repair button
			const well1Card = screen.getByText('Well #1').closest('article');
			const repairButton = well1Card?.querySelector('button[aria-label*="Repair"]');
			expect(repairButton).toBeInTheDocument();
		});

		it('should hide Repair button when health = 100%', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Farm #1: health 100% - should NOT have Repair button
			const farm1Card = screen.getByText('Farm #1').closest('article');
			const repairButton = farm1Card?.querySelector('button[aria-label*="Repair"]');
			expect(repairButton).not.toBeInTheDocument();
		});

		it('should always show Demolish button', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Check all 11 extractors have Demolish button
			const demolishButtons = screen.getAllByLabelText(/Demolish/i);
			expect(demolishButtons).toHaveLength(11);
		});

		it('should hide Upgrade button when health = 0 (destroyed)', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Farm #2: health 0%, level 4/5 - should NOT have Upgrade button
			const farm2Card = screen.getByText('Farm #2').closest('article');
			const upgradeButton = farm2Card?.querySelector('button[aria-label*="Upgrade"]');
			expect(upgradeButton).not.toBeInTheDocument();
		});

		it('should show Repair button when health = 0 (destroyed)', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Farm #2: health 0% - should have Repair button
			const farm2Card = screen.getByText('Farm #2').closest('article');
			const repairButton = farm2Card?.querySelector('button[aria-label*="Repair"]');
			expect(repairButton).toBeInTheDocument();
		});
	});

	describe('Event Callbacks', () => {
		it('should trigger onUpgrade callback with correct extractorId', async () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Click Upgrade button on Farm #1 (ext_1)
			const upgradeButton = screen.getByLabelText(/Upgrade Farm #1/i);
			await fireEvent.click(upgradeButton);

			expect(onUpgradeMock).toHaveBeenCalledTimes(1);
			expect(onUpgradeMock).toHaveBeenCalledWith('ext_1');
		});

		it('should trigger onRepair callback with correct extractorId', async () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Click Repair button on Well #1 (ext_2, health 85%)
			const repairButton = screen.getByLabelText(/Repair Well #1/i);
			await fireEvent.click(repairButton);

			expect(onRepairMock).toHaveBeenCalledTimes(1);
			expect(onRepairMock).toHaveBeenCalledWith('ext_2');
		});

		it('should trigger onDemolish callback with correct extractorId', async () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Click Demolish button on Mine #1 (ext_5)
			const demolishButton = screen.getByLabelText(/Demolish Mine #1/i);
			await fireEvent.click(demolishButton);

			expect(onDemolishMock).toHaveBeenCalledTimes(1);
			expect(onDemolishMock).toHaveBeenCalledWith('ext_5');
		});

		it('should trigger multiple callbacks independently', async () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Click Upgrade on Farm #1
			const upgradeButton = screen.getByLabelText(/Upgrade Farm #1/i);
			await fireEvent.click(upgradeButton);

			// Click Repair on Well #1
			const repairButton = screen.getByLabelText(/Repair Well #1/i);
			await fireEvent.click(repairButton);

			// Click Demolish on Mine #1
			const demolishButton = screen.getByLabelText(/Demolish Mine #1/i);
			await fireEvent.click(demolishButton);

			expect(onUpgradeMock).toHaveBeenCalledTimes(1);
			expect(onRepairMock).toHaveBeenCalledTimes(1);
			expect(onDemolishMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('Accessibility', () => {
		it('should have section with proper heading structure', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Section should have h3 heading
			const sectionHeading = screen.getByRole('heading', { level: 3 });
			expect(sectionHeading.textContent).toContain('Extractors');

			// Tile sections should have h4 headings
			const tileHeadings = screen.getAllByRole('heading', { level: 4 });
			expect(tileHeadings).toHaveLength(3);

			// Extractor cards should have h5 headings
			const cardHeadings = screen.getAllByRole('heading', { level: 5 });
			expect(cardHeadings).toHaveLength(11);
		});

		it('should have health bars with progressbar role and ARIA attributes', () => {
			const { container } = render(ExtractorsGridPanel, { props: defaultProps });

			const progressBars = container.querySelectorAll('[role="progressbar"]');
			expect(progressBars).toHaveLength(11);

			progressBars.forEach((bar) => {
				expect(bar.getAttribute('role')).toBe('progressbar');
				expect(bar.getAttribute('aria-valuemin')).toBe('0');
				expect(bar.getAttribute('aria-valuemax')).toBe('100');
				expect(bar.hasAttribute('aria-valuenow')).toBe(true);
			});
		});

		it('should have action buttons with descriptive aria-label', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Check Upgrade buttons
			expect(screen.getByLabelText(/Upgrade Farm #1/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Upgrade Well #1/i)).toBeInTheDocument();

			// Check Repair buttons
			expect(screen.getByLabelText(/Repair Well #1/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Repair Lumber Mill #1/i)).toBeInTheDocument();

			// Check Demolish buttons
			expect(screen.getByLabelText(/Demolish Farm #1/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Demolish Mine #1/i)).toBeInTheDocument();
		});

		it('should support keyboard navigation with Enter key', async () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			const upgradeButton = screen.getByLabelText(/Upgrade Farm #1/i);
			upgradeButton.focus();

			await fireEvent.keyDown(upgradeButton, { key: 'Enter' });

			expect(onUpgradeMock).toHaveBeenCalledTimes(1);
			expect(onUpgradeMock).toHaveBeenCalledWith('ext_1');
		});

		it('should support keyboard navigation with Space key', async () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			const repairButton = screen.getByLabelText(/Repair Well #1/i);
			repairButton.focus();

			await fireEvent.keyDown(repairButton, { key: ' ' });

			expect(onRepairMock).toHaveBeenCalledTimes(1);
			expect(onRepairMock).toHaveBeenCalledWith('ext_2');
		});

		it('should have empty state with descriptive text', () => {
			const emptyProps = { ...defaultProps, extractorsByTile: {} };
			render(ExtractorsGridPanel, { props: emptyProps });

			// Check empty state has informative text
			expect(screen.getByText(/No extractors yet/i)).toBeInTheDocument();
			expect(
				screen.getByText(/Build extractors on resource tiles to start production/i)
			).toBeInTheDocument();
		});
	});

	describe('Level Display', () => {
		it('should display current level and max level', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// Farm #1: level 1/5
			expect(screen.getByText(/Level 1\/5/i)).toBeInTheDocument();

			// Well #1: level 2/5
			expect(screen.getByText(/Level 2\/5/i)).toBeInTheDocument();

			// Quarry #1: level 5/5 (max level)
			expect(screen.getByText(/Level 5\/5/i)).toBeInTheDocument();
		});
	});

	describe('Multiple Tiles Layout', () => {
		it('should render tiles in correct order', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			const tileHeadings = screen.getAllByRole('heading', { level: 4 });

			// Tiles should be in Object.keys order
			const tileIds = Object.keys(mockExtractorsByTile);
			tileHeadings.forEach((heading, index) => {
				const expectedId = tileIds[index].slice(0, 8); // Truncated
				expect(heading.textContent).toContain(expectedId);
			});
		});

		it('should display correct extractor count per tile', () => {
			render(ExtractorsGridPanel, { props: defaultProps });

			// tile_abc123: 4 extractors
			const tile1Section = screen.getByText(/tile_abc/).closest('article');
			const tile1Cards = tile1Section?.querySelectorAll('article > article');
			expect(tile1Cards?.length).toBe(4);

			// tile_def456: 2 extractors
			const tile2Section = screen.getByText(/tile_def/).closest('article');
			const tile2Cards = tile2Section?.querySelectorAll('article > article');
			expect(tile2Cards?.length).toBe(2);

			// tile_ghi789: 5 extractors
			const tile3Section = screen.getByText(/tile_ghi/).closest('article');
			const tile3Cards = tile3Section?.querySelectorAll('article > article');
			expect(tile3Cards?.length).toBe(5);
		});
	});
});
