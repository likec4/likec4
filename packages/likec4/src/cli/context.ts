import { fromWorkspace } from '@likec4/language-services/node'
import { createContext } from 'unctx'

/**
 * Creates dependencies of CLI commands.
 * Commands take them from {@link useCli}, so tests can replace them with `vi.spyOn(useCli(), ...)`
 * instead of mocking modules.
 */
export function createCliContext() {
  return {
    fromWorkspace,
  }
}

/**
 * Dependencies of CLI commands, see {@link createCliContext}
 */
export type CliContext = ReturnType<typeof createCliContext>

const cliCtx = createContext<CliContext>()

/**
 * Returns dependencies of CLI commands.
 * @throws If the context is not set, see {@link setCliContext}
 */
export function useCli(): CliContext {
  return cliCtx.use()
}

/**
 * Sets dependencies of CLI commands: once in the CLI entry point, and before each test in specs
 */
export function setCliContext(ctx: CliContext): void {
  cliCtx.set(ctx, true)
}
