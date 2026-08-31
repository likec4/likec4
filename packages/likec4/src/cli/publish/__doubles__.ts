/**
 * Test doubles shared by `handler.spec.ts` and `handler.integration.spec.ts`.
 *
 * The suite runs with `--no-isolate`, so every spec file in a worker shares one module
 * registry: whichever file first mocks `./git`, `../../logger` or
 * `@likec4/language-services/node` wins for all the others, and the losing file's own
 * `vi.hoisted` doubles are never wired to anything. Both files therefore register the *same*
 * doubles from this module, so behaviour no longer depends on the order vitest happens to
 * pick.
 */
import type { fromWorkspace as FromWorkspace } from '@likec4/language-services/node'
import { vi } from 'vitest'

/** Lines captured from the faked `createLikeC4Logger`. */
export const logs = {
  info: [] as string[],
  warn: [] as string[],
  error: [] as string[],
}

export function clearLogs(): void {
  logs.info.length = 0
  logs.warn.length = 0
  logs.error.length = 0
}

/** Replaces `createLikeC4Logger`, recording every line into {@link logs}. */
export function fakeLogger() {
  return {
    info: (msg: string) => void logs.info.push(msg),
    debug: () => {},
    warn: (msg: unknown) => void logs.warn.push(String(msg)),
    warnOnce: (msg: string) => void logs.warn.push(msg),
    error: (msg: unknown) => void logs.error.push(String(msg)),
    clearScreen: () => {},
    hasErrorLogged: () => false,
    hasWarned: false,
  }
}

/** Replaces `createGitRunner` - only spawning `git` is faked, the parsing above it stays real. */
export const createGitRunner = vi.fn<() => (args: readonly string[]) => Promise<string>>()

/**
 * Replaces `fromWorkspace`. Defaults to the real implementation, so a spec that wants real
 * language services against a fixture on disk simply does not touch it; `handler.spec.ts`
 * opts into a fake per test and calls {@link useRealWorkspace} again afterwards.
 */
export const fromWorkspace = vi.fn<(...args: Parameters<typeof FromWorkspace>) => Promise<unknown>>()

let realFromWorkspace: typeof FromWorkspace | undefined

/** Called from the `vi.mock` factory, which is the only place holding the unmocked module. */
export function rememberRealWorkspace(actual: typeof FromWorkspace): void {
  realFromWorkspace = actual
  useRealWorkspace()
}

/** Points {@link fromWorkspace} back at the real implementation. */
export function useRealWorkspace(): void {
  fromWorkspace.mockImplementation((...args) => realFromWorkspace!(...args))
}
