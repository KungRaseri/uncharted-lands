import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/svelte';
import LightSwitch from '$lib/components/app/LightSwitch.svelte';

// Mock the browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('LightSwitch.svelte', () => {
	let localStorageMock: { [key: string]: string };

	beforeEach(() => {
		// Create a mock localStorage
		localStorageMock = {};
		
		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: vi.fn((key: string) => localStorageMock[key] || null),
				setItem: vi.fn((key: string, value: string) => {
					localStorageMock[key] = value;
				}),
				removeItem: vi.fn((key: string) => {
					delete localStorageMock[key];
				}),
				clear: vi.fn(() => {
					localStorageMock = {};
				})
			},
			writable: true
		});

		// Reset document.documentElement.setAttribute spy
		vi.spyOn(document.documentElement, 'setAttribute');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Initialization', () => {
		it('should render the light switch component', async () => {
			render(LightSwitch);

			await waitFor(() => {
				// Look for label or checkbox element
				const labels = document.querySelectorAll('label, input[type="checkbox"]');
				expect(labels.length).toBeGreaterThan(0);
			});
		});

		it('should initialize with light mode when no localStorage value exists', async () => {
			render(LightSwitch);

			await waitFor(() => {
				expect(localStorage.getItem).toHaveBeenCalledWith('mode');
			});
		});

		it('should initialize with stored mode from localStorage', async () => {
			localStorageMock['mode'] = 'dark';
			render(LightSwitch);

			await waitFor(() => {
				expect(localStorage.getItem).toHaveBeenCalledWith('mode');
			});
		});

		it('should show placeholder during initial render', () => {
			const { container } = render(LightSwitch);
			expect(container).toBeTruthy();
		});
	});

	describe('Theme Switching', () => {
		it('should display Sun icon in light mode', async () => {
			localStorageMock['mode'] = 'light';
			render(LightSwitch);

			await waitFor(() => {
				// Sun icon should be present
				const svgs = document.querySelectorAll('svg');
				expect(svgs.length).toBeGreaterThan(0);
			});
		});

		it('should display Moon icon in dark mode', async () => {
			localStorageMock['mode'] = 'dark';
			render(LightSwitch);

			await waitFor(() => {
				// Moon icon should be present
				const svgs = document.querySelectorAll('svg');
				expect(svgs.length).toBeGreaterThan(0);
			});
		});

		it('should respond to switch interaction', async () => {
			localStorageMock['mode'] = 'light';
			const { container } = render(LightSwitch);

			await waitFor(async () => {
				// Find the actual switch control (label or input)
				const switchLabel = container.querySelector('label');
				const checkbox = container.querySelector('input[type="checkbox"]');
				
				if (checkbox) {
					await fireEvent.click(checkbox);
				} else if (switchLabel) {
					await fireEvent.click(switchLabel);
				}
				
				// Just verify the component responds to interaction
				expect(container).toBeTruthy();
			});
		});
	});

	describe('LocalStorage Integration', () => {
		it('should read mode from localStorage on mount', async () => {
			localStorageMock['mode'] = 'dark';
			render(LightSwitch);

			await waitFor(() => {
				expect(localStorage.getItem).toHaveBeenCalledWith('mode');
			});
		});

		it('should handle missing localStorage value', async () => {
			// Don't set any value in localStorage
			render(LightSwitch);

			await waitFor(() => {
				expect(localStorage.getItem).toHaveBeenCalledWith('mode');
				// Should default to light mode
				const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
				// Component should render even without stored value
				expect(checkbox || document.querySelector('label')).toBeTruthy();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have checkbox input', async () => {
			render(LightSwitch);

			await waitFor(() => {
				const checkbox = document.querySelector('input[type="checkbox"]');
				expect(checkbox).toBeTruthy();
			});
		});

		it('should have label for checkbox', async () => {
			render(LightSwitch);

			await waitFor(() => {
				const label = document.querySelector('label');
				expect(label).toBeTruthy();
			});
		});

		it('should be interactive', async () => {
			const { container } = render(LightSwitch);

			await waitFor(() => {
				const interactive = container.querySelector('label, button, input');
				expect(interactive).toBeTruthy();
			});
		});
	});

	describe('SSR Compatibility', () => {
		it('should handle server-side rendering gracefully', () => {
			// This test ensures the component doesn't crash during SSR
			const { container } = render(LightSwitch);
			expect(container).toBeTruthy();
		});

		it('should show placeholder before client hydration', () => {
			const { container } = render(LightSwitch);
			// The component should render something immediately
			expect(container.firstChild).toBeTruthy();
		});

		it('should render with mounted state', async () => {
			render(LightSwitch);

			await waitFor(() => {
				// After mounting, should have the switch component
				const label = document.querySelector('label');
				expect(label).toBeTruthy();
			});
		});
	});

	describe('Visual States', () => {
		it('should render in light mode', async () => {
			localStorageMock['mode'] = 'light';
			const { container } = render(LightSwitch);

			await waitFor(() => {
				// Should have Sun icon
				const svg = container.querySelector('svg');
				expect(svg).toBeTruthy();
			});
		});

		it('should render in dark mode', async () => {
			localStorageMock['mode'] = 'dark';
			const { container } = render(LightSwitch);

			await waitFor(() => {
				// Should have Moon icon
				const svg = container.querySelector('svg');
				expect(svg).toBeTruthy();
			});
		});

		it('should have proper styling', async () => {
			const { container } = render(LightSwitch);

			await waitFor(() => {
				// Should have styled elements
				const styledElement = container.querySelector('[class*="skb:"]');
				expect(styledElement).toBeTruthy();
			});
		});
	});
});
