import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UnderConstruction from '$lib/components/app/UnderConstruction.svelte';

describe('UnderConstruction.svelte', () => {
	describe('Basic Rendering', () => {
		it('should render the component', () => {
			const { container } = render(UnderConstruction);
			expect(container).toBeTruthy();
		});

		it('should display the "Area Under Construction" message', () => {
			render(UnderConstruction);
			expect(screen.getByText('Area Under Construction')).toBeDefined();
		});

		it('should render as an aside element', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside).toBeTruthy();
		});

		it('should have alert styling', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside?.classList.contains('alert')).toBe(true);
		});
	});

	describe('Visual Elements', () => {
		it('should display the hammer icon', () => {
			const { container } = render(UnderConstruction);
			// Lucide icons render as SVG elements
			const svg = container.querySelector('svg');
			expect(svg).toBeTruthy();
		});

		it('should have warning color scheme', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			const hasWarningClass = aside?.className.includes('warning');
			expect(hasWarningClass).toBe(true);
		});

		it('should center align content', () => {
			const { container } = render(UnderConstruction);
			const alertMessage = container.querySelector('.alert-message');
			expect(alertMessage?.classList.contains('items-center')).toBe(true);
			expect(alertMessage?.classList.contains('justify-center')).toBe(true);
		});

		it('should display icon and text in a flex container', () => {
			const { container } = render(UnderConstruction);
			const alertMessage = container.querySelector('.alert-message');
			expect(alertMessage?.classList.contains('flex')).toBe(true);
		});
	});

	describe('Styling and Layout', () => {
		it('should have proper spacing classes', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside?.classList.contains('mx-auto')).toBe(true);
			expect(aside?.classList.contains('mt-5')).toBe(true);
		});

		it('should have fixed width', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside?.classList.contains('w-96')).toBe(true);
		});

		it('should have dark mode styles', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			const hasDarkClasses = aside?.className.includes('dark:');
			expect(hasDarkClasses).toBe(true);
		});
	});

	describe('Accessibility', () => {
		it('should have semantic aside element', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside?.tagName).toBe('ASIDE');
		});

		it('should have readable text content', () => {
			render(UnderConstruction);
			const text = screen.getByText('Area Under Construction');
			expect(text.textContent).toBeTruthy();
			expect(text.textContent?.length).toBeGreaterThan(0);
		});

		it('should have appropriate text size', () => {
			const { container } = render(UnderConstruction);
			const text = container.querySelector('.text-lg');
			expect(text).toBeTruthy();
		});
	});

	describe('Icon Properties', () => {
		it('should have properly sized icon', () => {
			render(UnderConstruction);
			// The hammer icon should be rendered with size 36
			const text = screen.getByText('Area Under Construction');
			const parent = text.parentElement;
			const iconContainer = parent?.querySelector('span:first-child');
			expect(iconContainer).toBeTruthy();
		});

		it('should have icon with padding', () => {
			const { container } = render(UnderConstruction);
			const iconContainer = container.querySelectorAll('.p-1');
			expect(iconContainer.length).toBeGreaterThan(0);
		});
	});

	describe('Component Structure', () => {
		it('should have alert message wrapper', () => {
			const { container } = render(UnderConstruction);
			const alertMessage = container.querySelector('.alert-message');
			expect(alertMessage).toBeTruthy();
		});

		it('should have proper color scheme in light mode', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside?.className.includes('bg-warning-100')).toBe(true);
		});

		it('should have proper color scheme in dark mode', () => {
			const { container } = render(UnderConstruction);
			const aside = container.querySelector('aside');
			expect(aside?.className.includes('dark:bg-warning-800')).toBe(true);
		});

		it('should have text color variants for dark/light mode', () => {
			const { container } = render(UnderConstruction);
			const alertMessage = container.querySelector('.alert-message');
			const hasTextColors = alertMessage?.className.includes('text-warning-800') && 
			                      alertMessage?.className.includes('dark:text-warning-100');
			expect(hasTextColors).toBe(true);
		});
	});
});
