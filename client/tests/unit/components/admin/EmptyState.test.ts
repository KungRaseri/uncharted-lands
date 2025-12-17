import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EmptyState from '$lib/components/admin/EmptyState.svelte';
import { Database, Plus } from 'lucide-svelte';

describe('EmptyState.svelte', () => {
	const baseProps = {
		icon: Database,
		title: 'No Data Available',
		message: 'There are no items to display at this time.'
	};

	describe('Basic Rendering', () => {
		it('should render the component', () => {
			const { container } = render(EmptyState, { props: baseProps });
			expect(container).toBeTruthy();
		});

		it('should display the title', () => {
			render(EmptyState, { props: baseProps });
			expect(screen.getByText('No Data Available')).toBeDefined();
		});

		it('should display the message', () => {
			render(EmptyState, { props: baseProps });
			expect(screen.getByText('There are no items to display at this time.')).toBeDefined();
		});

		it('should render icon when provided', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const svg = container.querySelector('svg');
			expect(svg).toBeTruthy();
		});

		it('should not render action button when no action props provided', () => {
			render(EmptyState, { props: baseProps });
			const buttons = screen.queryAllByRole('link');
			expect(buttons.length).toBe(0);
		});
	});

	describe('Action Button', () => {
		it('should render action button when actionHref and actionText provided', () => {
			render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New'
				}
			});

			const button = screen.getByText('Create New');
			expect(button).toBeDefined();
		});

		it('should have correct href on action button', () => {
			const { container } = render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New'
				}
			});

			const link = container.querySelector('a[href="/create"]');
			expect(link).toBeTruthy();
		});

		it('should render action icon when provided', () => {
			const { container } = render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New',
					actionIcon: Plus
				}
			});

			// Should have 2 SVGs - one for main icon, one for action icon
			const svgs = container.querySelectorAll('svg');
			expect(svgs.length).toBe(2);
		});

		it('should not render action button when only actionHref is provided', () => {
			render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create'
				}
			});

			const links = screen.queryAllByRole('link');
			expect(links.length).toBe(0);
		});

		it('should not render action button when only actionText is provided', () => {
			render(EmptyState, {
				props: {
					...baseProps,
					actionText: 'Create New'
				}
			});

			const button = screen.queryByText('Create New');
			expect(button).toBeNull();
		});

		it('should have primary button styling', () => {
			const { container } = render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New'
				}
			});

			const button = container.querySelector('.btn');
			expect(button?.classList.contains('preset-filled-primary-500')).toBe(true);
		});

		it('should have rounded corners on action button', () => {
			const { container } = render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New'
				}
			});

			const button = container.querySelector('.btn');
			expect(button?.classList.contains('rounded-md')).toBe(true);
		});
	});

	describe('Layout and Styling', () => {
		it('should center content', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const wrapper = container.querySelector('.text-center');
			expect(wrapper).toBeTruthy();
		});

		it('should have proper padding', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const wrapper = container.querySelector('.p-12');
			expect(wrapper).toBeTruthy();
		});

		it('should have title with proper font styling', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const title = screen.getByText('No Data Available');
			expect(title.classList.contains('text-xl')).toBe(true);
			expect(title.classList.contains('font-semibold')).toBe(true);
		});

		it('should have title with bottom margin', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const title = screen.getByText('No Data Available');
			expect(title.classList.contains('mb-2')).toBe(true);
		});

		it('should have message with proper text color', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const message = screen.getByText('There are no items to display at this time.');
			const hasTextColors =
				message.className.includes('text-surface-600') &&
				message.className.includes('dark:text-surface-400');
			expect(hasTextColors).toBe(true);
		});

		it('should have message with bottom margin', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const message = screen.getByText('There are no items to display at this time.');
			expect(message.classList.contains('mb-4')).toBe(true);
		});

		it('should center icon horizontally', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const svg = container.querySelector('svg');
			expect(svg?.classList.contains('mx-auto')).toBe(true);
		});

		it('should have icon with bottom margin', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const svg = container.querySelector('svg');
			expect(svg?.classList.contains('mb-4')).toBe(true);
		});

		it('should render icon with gray color', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const svg = container.querySelector('svg');
			expect(svg?.classList.contains('text-surface-400')).toBe(true);
		});
	});

	describe('Different Content Scenarios', () => {
		it('should handle long titles', () => {
			render(EmptyState, {
				props: {
					...baseProps,
					title: 'This is a Very Long Title That Might Wrap to Multiple Lines in Some Cases'
				}
			});

			const title = screen.getByText(/This is a Very Long Title/);
			expect(title).toBeDefined();
		});

		it('should handle long messages', () => {
			const longMessage =
				'This is a very long message that provides detailed information about why there is no data available and what the user might want to do next to resolve this situation.';

			render(EmptyState, {
				props: {
					...baseProps,
					message: longMessage
				}
			});

			const message = screen.getByText(longMessage);
			expect(message).toBeDefined();
		});

		it('should handle different icon types', () => {
			const { container } = render(EmptyState, {
				props: {
					...baseProps,
					icon: Plus
				}
			});
			const svg = container.querySelector('svg');
			expect(svg).toBeTruthy();
		});
		it('should work without optional action icon', () => {
			render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New'
					// No actionIcon provided
				}
			});

			const button = screen.getByText('Create New');
			expect(button).toBeDefined();
		});
	});

	describe('Accessibility', () => {
		it('should have semantic heading for title', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const heading = container.querySelector('h3');
			expect(heading).toBeTruthy();
			expect(heading?.textContent).toBe('No Data Available');
		});

		it('should have paragraph element for message', () => {
			const { container } = render(EmptyState, { props: baseProps });
			const paragraph = container.querySelector('p');
			expect(paragraph).toBeTruthy();
			expect(paragraph?.textContent).toBe('There are no items to display at this time.');
		});

		it('should have link with proper text for action button', () => {
			render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New Item'
				}
			});

			const link = screen.getByRole('link');
			expect(link.textContent).toContain('Create New Item');
		});

		it('should maintain focus order', () => {
			const { container } = render(EmptyState, {
				props: {
					...baseProps,
					actionHref: '/create',
					actionText: 'Create New'
				}
			});

			// The action button should be after the text content
			const elements = Array.from(container.querySelectorAll('*'));
			const titleIndex = elements.findIndex((el) =>
				el.textContent?.includes('No Data Available')
			);
			const messageIndex = elements.findIndex((el) =>
				el.textContent?.includes('There are no items')
			);
			const buttonIndex = elements.findIndex((el) => el.tagName === 'A');

			if (buttonIndex > -1) {
				expect(buttonIndex).toBeGreaterThan(titleIndex);
				expect(buttonIndex).toBeGreaterThan(messageIndex);
			}
		});
	});

	describe('Props Validation', () => {
		it('should handle all required props', () => {
			const { container } = render(EmptyState, {
				props: {
					icon: Database,
					title: 'Test Title',
					message: 'Test Message'
				}
			});

			expect(screen.getByText('Test Title')).toBeDefined();
			expect(screen.getByText('Test Message')).toBeDefined();
			expect(container.querySelector('svg')).toBeTruthy();
		});

		it('should handle all optional props', () => {
			const { container } = render(EmptyState, {
				props: {
					icon: Database,
					title: 'Test Title',
					message: 'Test Message',
					actionHref: '/test',
					actionText: 'Test Action',
					actionIcon: Plus
				}
			});

			expect(screen.getByText('Test Title')).toBeDefined();
			expect(screen.getByText('Test Message')).toBeDefined();
			expect(screen.getByText('Test Action')).toBeDefined();
			expect(container.querySelectorAll('svg').length).toBe(2);
		});
	});
});
