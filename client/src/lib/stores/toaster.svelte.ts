import { createToaster } from '@skeletonlabs/skeleton-svelte';

/**
 * Toaster Store (Svelte 5)
 * Manages toast notifications throughout the app using Skeleton Svelte's toast system
 *
 * Reference: https://www.skeleton.dev/docs/svelte/framework-components/toast.md
 */

// Store state with Svelte 5 runes
const state = $state<{
	toaster: ReturnType<typeof createToaster> | null;
}>({
	toaster: null
});

/**
 * Initialize the toaster instance
 * Should be called once in the root layout
 */
export function initializeToaster() {
	if (!state.toaster) {
		state.toaster = createToaster({
			placement: 'top-center',
			duration: 4000 // Default duration in ms
		});
	}
	return state.toaster;
}

/**
 * Get the toaster instance
 * Throws error if not initialized
 */
export function getToaster(): ReturnType<typeof createToaster> {
	if (!state.toaster) {
		throw new Error('Toaster not initialized. Call initializeToaster() first in root layout.');
	}
	return state.toaster;
}

/**
 * Check if toaster is initialized
 */
export function isToasterInitialized(): boolean {
	return state.toaster !== null;
}

/**
 * Helper functions for common toast types
 */
export const toaster = {
	/**
	 * Show a success toast
	 */
	success(title: string, description?: string, duration = 3000) {
		const instance = getToaster();
		instance.success({
			title,
			description,
			duration
		});
	},

	/**
	 * Show an error toast
	 */
	error(title: string, description?: string, duration = 5000) {
		const instance = getToaster();
		instance.error({
			title,
			description,
			duration
		});
	},

	/**
	 * Show an info toast
	 */
	info(title: string, description?: string, duration = 4000) {
		const instance = getToaster();
		instance.info({
			title,
			description,
			duration
		});
	},

	/**
	 * Show a warning toast
	 */
	warning(title: string, description?: string, duration = 4000) {
		const instance = getToaster();
		instance.warning({
			title,
			description,
			duration
		});
	}
};
