import { createToaster } from '@skeletonlabs/skeleton-svelte';

/**
 * Shared toaster instance for all components
 * Used for displaying toast notifications throughout the app
 */
export const toaster = createToaster({ placement: 'top-center' });
