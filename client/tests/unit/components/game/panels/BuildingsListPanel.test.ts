import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import BuildingsListPanel from '$lib/components/game/panels/BuildingsListPanel.svelte';

describe('BuildingsListPanel', () => {
	const mockBuildings = [
		{
			id: 'building-1',
			structureId: 'HOUSE',
			name: 'House',
			description: 'Provides housing for population',
			level: 1,
			maxLevel: 5,
			health: 100,
			buildingType: 'HOUSING',
			extractorType: null,
			category: 'BUILDING',
			modifiers: [
				{
					id: 'mod-1',
					name: 'Population Capacity',
					description: 'Increases population capacity',
					value: 5
				}
			]
		},
		{
			id: 'building-2',
			structureId: 'WAREHOUSE',
			name: 'Warehouse',
			description: 'Increases storage capacity',
			level: 3,
			maxLevel: 5,
			health: 75,
			buildingType: 'STORAGE',
			extractorType: null,
			category: 'BUILDING',
			modifiers: []
		},
		{
			id: 'building-3',
			structureId: 'WORKSHOP',
			name: 'Workshop',
			description: 'Advanced crafting facility',
			level: 5,
			maxLevel: 5,
			health: 50,
			buildingType: 'PRODUCTION',
			extractorType: null,
			category: 'BUILDING',
			modifiers: []
		}
	];

	const mockHandlers = {
		onUpgrade: vi.fn(),
		onRepair: vi.fn(),
		onDemolish: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock element.animate for Svelte transitions in JSDOM
		(HTMLElement.prototype as any).animate = vi.fn(() => ({
			finished: Promise.resolve(),
			cancel: vi.fn(),
			onfinish: null
		}));
	});

	describe('Rendering', () => {
		it('should render buildings count in header', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText(/Buildings \(3\)/i)).toBeInTheDocument();
		});

		it('should display empty state when no buildings', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: [],
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText(/No buildings yet/i)).toBeInTheDocument();
			expect(screen.getByText(/Click Build to add your first building/i)).toBeInTheDocument();
		});

		it('should render all buildings with correct names', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText('House')).toBeInTheDocument();
			expect(screen.getByText('Warehouse')).toBeInTheDocument();
			expect(screen.getByText('Workshop')).toBeInTheDocument();
		});

		it('should display building levels correctly', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText('Level 1/5')).toBeInTheDocument();
			expect(screen.getByText('Level 3/5')).toBeInTheDocument();
			expect(screen.getByText('Level 5/5')).toBeInTheDocument();
		});
	});

	describe('Health Display', () => {
		it('should show correct health percentage', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText('100%')).toBeInTheDocument(); // House
			expect(screen.getByText('75%')).toBeInTheDocument(); // Warehouse
			expect(screen.getByText('50%')).toBeInTheDocument(); // Workshop
		});

		it('should display correct health labels', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText('Pristine')).toBeInTheDocument(); // 100%
			expect(screen.getByText('Good')).toBeInTheDocument(); // 75%
			expect(screen.getByText('Damaged')).toBeInTheDocument(); // 50%
		});

		it('should apply correct color classes based on health', () => {
			const { container } = render(BuildingsListPanel, {
				props: {
					buildings: [
						{ ...mockBuildings[0], health: 100 }, // Green (success)
						{ ...mockBuildings[1], health: 75 }, // Yellow (warning)
						{ ...mockBuildings[2], health: 50 } // Orange (warning-700)
					],
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			const healthElements = container.querySelectorAll(
				'.text-success-500, .text-warning-500, .text-warning-700'
			);
			expect(healthElements.length).toBeGreaterThan(0);
		});
	});

	describe('Modifiers', () => {
		it('should show modifiers toggle button when modifiers exist', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.getByText(/Modifiers \(1\)/i)).toBeInTheDocument();
		});

		it('should not show modifiers toggle when no modifiers', () => {
			render(BuildingsListPanel, {
				props: {
					buildings: [mockBuildings[1]], // Warehouse has no modifiers
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			expect(screen.queryByText(/Modifiers/i)).not.toBeInTheDocument();
		});

		it('should expand modifiers when toggle clicked', async () => {
			const { container } = render(BuildingsListPanel, {
				props: {
					buildings: mockBuildings,
					settlementId: 'settlement-1',
					...mockHandlers
				}
			});

			const toggleButton = screen.getByText(/Modifiers \(1\)/i);
			await fireEvent.click(toggleButton);

			expect(screen.getByText('Population Capacity')).toBeInTheDocument();
			expect(screen.getByText('Increases population capacity')).toBeInTheDocument();
		// Check for modifier value - text may have spacing variations
		const text = container.textContent?.replace(/\s+/g, ' ').trim() || '';
		expect(text).toMatch(/\+\s*5/); // Matches "+5" or "+ 5"
			expect(text).toContain('(5 / Level)');
		});

		describe('Action Buttons', () => {
			it('should show Upgrade button when building can be upgraded', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]], // House level 1/5
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				expect(screen.getByText('Upgrade to Level 2')).toBeInTheDocument();
			});

			it('should not show Upgrade button when at max level', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[2]], // Workshop level 5/5
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				expect(screen.queryByText(/Upgrade/i)).not.toBeInTheDocument();
				expect(screen.getByText('Max level reached')).toBeInTheDocument();
			});

			it('should show Repair button when health < 100', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[1]], // Warehouse 75% health
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				expect(screen.getByText(/Repair \(25% damage\)/i)).toBeInTheDocument();
			});

			it('should not show Repair button when health = 100', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]], // House 100% health
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				expect(screen.queryByText(/Repair/i)).not.toBeInTheDocument();
			});

			it('should always show Demolish button', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: mockBuildings,
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const demolishButtons = screen.getAllByText('Demolish');
				expect(demolishButtons).toHaveLength(3);
			});
		});

		describe('Event Handlers', () => {
			it('should call onUpgrade when Upgrade button clicked', async () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const upgradeButton = screen.getByText('Upgrade to Level 2');
				await fireEvent.click(upgradeButton);

				expect(mockHandlers.onUpgrade).toHaveBeenCalledWith('building-1');
				expect(mockHandlers.onUpgrade).toHaveBeenCalledTimes(1);
			});

			it('should call onRepair when Repair button clicked', async () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[1]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const repairButton = screen.getByText(/Repair/i);
				await fireEvent.click(repairButton);

				expect(mockHandlers.onRepair).toHaveBeenCalledWith('building-2');
				expect(mockHandlers.onRepair).toHaveBeenCalledTimes(1);
			});

			it('should call onDemolish when Demolish button clicked', async () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const demolishButton = screen.getByText('Demolish');
				await fireEvent.click(demolishButton);

				expect(mockHandlers.onDemolish).toHaveBeenCalledWith('building-1');
				expect(mockHandlers.onDemolish).toHaveBeenCalledTimes(1);
			});
		});

		describe('Accessibility', () => {
			it('should have proper ARIA labels for section', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: mockBuildings,
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const section = screen.getByRole('region', { name: /buildings/i });
				expect(section).toBeInTheDocument();
			});

			it('should have role="list" on buildings container', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: mockBuildings,
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const list = screen.getByRole('list');
				expect(list).toBeInTheDocument();
			});

			it('should have proper ARIA labels on action buttons', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				expect(screen.getByLabelText(/Upgrade House to level 2/i)).toBeInTheDocument();
				expect(screen.getByLabelText(/Demolish House/i)).toBeInTheDocument();
			});

			it('should have aria-expanded on modifiers toggle', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const toggleButton = screen.getByRole('button', { name: /Modifiers/i });
				expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
			});

			it('should have progressbar role for health bar', () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const progressbar = screen.getByRole('progressbar', {
					name: /Structure health: 100%/i
				});
				expect(progressbar).toBeInTheDocument();
				expect(progressbar).toHaveAttribute('aria-valuenow', '100');
				expect(progressbar).toHaveAttribute('aria-valuemin', '0');
				expect(progressbar).toHaveAttribute('aria-valuemax', '100');
			});
		});

		describe('Keyboard Navigation', () => {
			it('should handle Enter key on modifiers toggle', async () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const toggleButton = screen.getByText(/Modifiers/i);
				await fireEvent.keyDown(toggleButton, { key: 'Enter' });

				expect(screen.getByText('Population Capacity')).toBeInTheDocument();
			});

			it('should handle Space key on modifiers toggle', async () => {
				render(BuildingsListPanel, {
					props: {
						buildings: [mockBuildings[0]],
						settlementId: 'settlement-1',
						...mockHandlers
					}
				});

				const toggleButton = screen.getByText(/Modifiers/i);
				await fireEvent.keyDown(toggleButton, { key: ' ' });

				expect(screen.getByText('Population Capacity')).toBeInTheDocument();
			});
		});
	});
});