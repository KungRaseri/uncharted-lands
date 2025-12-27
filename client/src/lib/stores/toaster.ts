import { createToaster, type ToasterStore } from '@skeletonlabs/skeleton-svelte';

/**
 * Shared toaster instance for all components
 * Used for displaying toast notifications throughout the app
 */
let toasterInstance: ToasterStore | null = null;

export function initializeToaster() {
	if (!toasterInstance) {
		toasterInstance = createToaster({ placement: 'top-center' });
	}
	return toasterInstance;
}

export function getToaster(): ToasterStore {
	if (!toasterInstance) {
		throw new Error('Toaster not initialized. Call initializeToaster() first in root layout.');
	}
	return toasterInstance;
}
