// Vitest setup file
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/svelte'

// Import matchers only once to avoid "Cannot redefine property" error
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
// Wrap in try-catch to handle cases where matchers are already registered
try {
  expect.extend(matchers)
} catch (error) {
  // Silently ignore if matchers are already extended
  if (!error.message?.includes('Cannot redefine property')) {
    throw error
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})
