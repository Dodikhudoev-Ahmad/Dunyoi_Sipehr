import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom has no IntersectionObserver; `motion`'s `whileInView` (used throughout src/components/sections)
// depends on it, so components using it would throw a ReferenceError without this stub.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
// @ts-expect-error test-only global polyfill, not a spec-complete implementation
globalThis.IntersectionObserver = IntersectionObserverStub
