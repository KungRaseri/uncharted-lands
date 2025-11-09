// Vitest setup file
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/svelte'

// Import matchers only once to avoid "Cannot redefine property" error
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
