// Vitest setup file
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/svelte'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
