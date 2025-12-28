// Vitest setup file
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Import matchers only once to avoid "Cannot redefine property" error
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
// Wrap in try-catch to handle cases where matchers are already registered
try {
	expect.extend(matchers);
} catch (error) {
	// Silently ignore if matchers are already extended
	if (!error.message?.includes('Cannot redefine property')) {
		throw error;
	}
}

// Polyfill Element.animate for tests (used by Svelte transitions)
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	Element.prototype.animate = function () {
		return {
			cancel: () => {},
			finish: () => {},
			play: () => {},
			pause: () => {},
			reverse: () => {},
			playbackRate: 1,
			playState: 'finished',
			finished: Promise.resolve()
		};
	};
}

// Cleanup after each test
afterEach(() => {
	cleanup();
});
