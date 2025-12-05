import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../../../test-utils';
import { fireEvent } from '@testing-library/svelte';
import QuickActionsBar from '$lib/components/game/QuickActionsBar.svelte';

// Mock stores
vi.mock('$lib/stores/game/alerts.svelte', () => ({
	alertsStore: {
		getAlertCount: vi.fn((settlementId: string, severity?: string) => {
			if (severity === 'critical') return 2;
			return 5;
		})
	}
}));

vi.mock('$lib/stores/game/construction.svelte', () => ({
	constructionStore: {
		getTotalCount: vi.fn(() => 3),
		getActiveCount: vi.fn(() => 1)
	}
}));

describe('QuickActionsBar', () => {
	const mockSettlementId = 'settlement-123';

	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render all 5 action buttons', () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			const buttons = container.querySelectorAll('.quick-action');
			expect(buttons).toHaveLength(5);

			// Verify all buttons are present by their labels
			expect(container.textContent).toContain('Alerts');
			expect(container.textContent).toContain('Build');
			expect(container.textContent).toContain('Collect');
			expect(container.textContent).toContain('Upgrade');
			expect(container.textContent).toContain('Repair');
		});

		it('should display alert badge with count', () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			// Find Alerts button
			const buttons = container.querySelectorAll('.quick-action');
			const alertsButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Alerts'));

			expect(alertsButton).toBeDefined();
			expect(alertsButton?.textContent).toContain('5'); // Total alert count
		});

		it('should display construction queue badge', () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			// Find Build button
			const buttons = container.querySelectorAll('.quick-action');
			const buildButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Build'));

			expect(buildButton).toBeDefined();
			expect(buildButton?.textContent).toContain('1/3'); // Active/Total construction
		});

		it('should show critical alert styling', () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			// Find Alerts button
			const buttons = container.querySelectorAll('.quick-action');
			const alertsButton = Array.from(buttons).find((btn) =>
				btn.textContent?.includes('Alerts')
			) as HTMLElement;

			expect(alertsButton).toBeDefined();
			expect(alertsButton.classList.contains('has-critical')).toBe(true);
		});
	});

	describe('Interaction', () => {
		it('should handle Alerts button click', async () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			const buttons = container.querySelectorAll('.quick-action');
			const alertsButton = Array.from(buttons).find((btn) =>
				btn.textContent?.includes('Alerts')
			) as HTMLElement;

			expect(alertsButton).toBeDefined();

			// Click should not throw error
			await fireEvent.click(alertsButton);
			// Note: Component sets alertsModalOpen = true, but we can't easily test that
			// without exposing state or testing modal rendering
		});

		it('should handle Build button click', async () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			const buttons = container.querySelectorAll('.quick-action');
			const buildButton = Array.from(buttons).find((btn) =>
				btn.textContent?.includes('Build')
			) as HTMLElement;

			expect(buildButton).toBeDefined();

			// Click should not throw error
			await fireEvent.click(buildButton);
		});

		it('should handle Collect button click', async () => {
			const consoleSpy = vi.spyOn(console, 'log');

			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			const buttons = container.querySelectorAll('.quick-action');
			const collectButton = Array.from(buttons).find((btn) =>
				btn.textContent?.includes('Collect')
			) as HTMLElement;

			expect(collectButton).toBeDefined();

			await fireEvent.click(collectButton);
			expect(consoleSpy).toHaveBeenCalledWith('Collect resources:', mockSettlementId);
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels and keyboard shortcuts', () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			// Check nav has proper label
			const nav = container.querySelector('nav');
			expect(nav?.getAttribute('aria-label')).toBe('Quick actions');

			// Check all buttons have aria-labels with keyboard shortcuts
			const buttons = container.querySelectorAll('.quick-action');
			for (const button of buttons) {
				const ariaLabel = button.getAttribute('aria-label');
				expect(ariaLabel).toBeTruthy();
				expect(ariaLabel).toMatch(/keyboard shortcut:/i);
			}
		});

		it('should disable unavailable actions', () => {
			const { container } = render(QuickActionsBar, {
				props: { settlementId: mockSettlementId }
			});

			// Repair button should be disabled (canRepair = false)
			const buttons = container.querySelectorAll('.quick-action');
			const repairButton = Array.from(buttons).find((btn) =>
				btn.textContent?.includes('Repair')
			) as HTMLButtonElement;

			expect(repairButton).toBeDefined();
			expect(repairButton.disabled).toBe(true);
		});
	});
});
