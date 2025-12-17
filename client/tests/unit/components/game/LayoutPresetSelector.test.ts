import { describe, it, expect, vi } from 'vitest';
import { render } from '../../../test-utils';
import { fireEvent } from '@testing-library/svelte';
import LayoutPresetSelector from '$lib/components/game/LayoutPresetSelector.svelte';

describe('LayoutPresetSelector', () => {
	describe('Rendering', () => {
		it('should render all preset options', () => {
			const mockOnPresetChange = vi.fn();
			const { container } = render(LayoutPresetSelector, {
				currentPreset: 'Default',
				onPresetChange: mockOnPresetChange
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			expect(select).toBeTruthy();

			// Should have 4 options
			const options = Array.from(select.querySelectorAll('option'));
			expect(options).toHaveLength(4);

			// Verify option values
			const optionValues = options.map((opt) => opt.value);
			expect(optionValues).toEqual([
				'Default',
				'Planning Mode',
				'Disaster Response',
				'Mobile Optimized'
			]);

			// Verify option labels include icons
			expect(options[0].textContent?.trim()).toContain('⚖️');
			expect(options[0].textContent?.trim()).toContain('Default');
		});

		it('should show current preset as selected', () => {
			const mockOnPresetChange = vi.fn();
			const { container } = render(LayoutPresetSelector, {
				currentPreset: 'Planning Mode',
				onPresetChange: mockOnPresetChange
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			expect(select.value).toBe('Planning Mode');
		});

		it('should display description of current preset', () => {
			const mockOnPresetChange = vi.fn();
			const { getByText } = render(LayoutPresetSelector, {
				currentPreset: 'Disaster Response',
				onPresetChange: mockOnPresetChange
			});

			// Should show description for current preset
			expect(getByText('Prioritize alerts and population safety')).toBeTruthy();
		});
	});

	describe('Interaction', () => {
		it('should call onPresetChange when selection changes', async () => {
			const mockOnPresetChange = vi.fn();
			const { container } = render(LayoutPresetSelector, {
				currentPreset: 'Default',
				onPresetChange: mockOnPresetChange
			});

			const select = container.querySelector('select') as HTMLSelectElement;

			// Change to Planning Mode
			await fireEvent.change(select, { target: { value: 'Planning Mode' } });

			expect(mockOnPresetChange).toHaveBeenCalledWith('Planning Mode');
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels', () => {
			const mockOnPresetChange = vi.fn();
			const { container } = render(LayoutPresetSelector, {
				currentPreset: 'Default',
				onPresetChange: mockOnPresetChange
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			expect(select.getAttribute('aria-label')).toBe('Dashboard layout preset');

			// Label should exist (screen reader only)
			const label = container.querySelector('label[for="layout-preset"]');
			expect(label).toBeTruthy();
			expect(label?.textContent?.trim()).toBe('Select dashboard layout preset');
			expect(label?.classList.contains('sr-only')).toBe(true);
		});
	});
});
