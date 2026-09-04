---
name: testing-with-fake-timers
description: Test hooks and logic with timing dependencies (debounce, setTimeout, setInterval) using Vitest fake timers. Use when a test needs to assert at a specific point in time or would otherwise wait on a real delay, and when waitFor() is hanging or behaving oddly in a timing test.
---

# Testing hooks with timing dependencies

**When to use fake timers:**

Use fake timers when you need to:

1. **Make assertions at specific points in time** - When testing debounce logic, loading states, or other time-dependent behavior
2. **Skip waiting for long timeouts** - When tests involve waiting for delays (e.g., API calls, debounce periods) and you want to advance time programmatically

Common scenarios:

- Hook tests with debounce logic (e.g., `useDebounceValue`)
- Tests with `setTimeout`, `setInterval`, or other timing-based logic
- Tests that would otherwise use `waitFor()` with long timeouts

**How to use fake timers in hook tests:**

**Key Principle**: **Avoid `waitFor()`** - Testing Library's `waitFor()` uses real timers internally and conflicts with fake timers.

1. **DO NOT use `renderHookWithAppWrapper`** - It uses `waitFor()` internally which conflicts with fake timers
2. **Choose the right test wrapper based on dependencies**:
    - **If the hook uses Redux**: Use `renderHookWithReduxStoreProvider` with a real store created via `setupStore()`
    - **If the hook doesn't use Redux**: Use `renderHook()` directly or create a minimal wrapper without `waitFor()`
    - **If the hook needs other contexts**: Create a custom wrapper that doesn't use `waitFor()`
3. **Enable fake timers** in `beforeEach()` and restore in `afterEach()`
4. **Control time** with `vi.advanceTimersByTimeAsync(ms)` instead of `waitFor()`

**Example with Redux:**

```typescript
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'

describe('useMyHook', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('debounces the API call', async () => {
        const store = setupStore(
            { mySlice: mySliceReducer },
            { mySlice: { someState: 'value' } }
        )

        const { result } = renderHookWithReduxStoreProvider(
            () => useMyHook(),
            store
        )

        // Trigger action
        act(() => {
            store.dispatch(someAction())
        })

        // Advance timers to complete debounce + API call
        await act(() => vi.advanceTimersByTimeAsync(300 + apiDelay))

        // Assert
        expect(result.current.data).toBeDefined()
    })
})
```

**Example without Redux (unit test):**

```typescript
import { renderHook } from '@testing-library/react'

describe('useMyUtilityHook', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('delays execution', async () => {
        const { result } = renderHook(() => useMyUtilityHook())

        // Trigger effect
        act(() => {
            result.current.triggerDelay()
        })

        // Advance timers
        await act(() => vi.advanceTimersByTimeAsync(1000))

        // Assert delayed behavior
        expect(result.current.isComplete).toBe(true)
    })
})
```

**Reference:** See `use-dimension-list.spec.ts` for a comprehensive example with 41 hook tests using fake timers (runs in 82ms vs 11.26s with real timers). Also see `use-delayed-is-loading-more.spec.ts` for a simpler example testing a custom hook with debounce-like timing behavior.
