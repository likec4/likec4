import { DependenciesNotInstalledError, InstallTargetNotFoundError } from '@likec4/language-services/node'
import k from 'tinyrainbow'

/**
 * Output of {@link handleCliFailure}, replaced in tests
 */
export interface CliFailureOutput {
  error(...args: unknown[]): void
  exit(code: number): void
}

const defaultOutput: CliFailureOutput = {
  error: (...args) => console.error(...args),
  exit: code => process.exit(code),
}

/**
 * Expected user errors: the message says what to do, help and stack are not printed
 */
export function isExpectedCliError(err: unknown): err is Error {
  return err instanceof DependenciesNotInstalledError || err instanceof InstallTargetNotFoundError
}

/**
 * Makes the stream blocking, so the output is written before `process.exit` (as yargs does)
 */
function setBlocking(stream: object): void {
  const handle: unknown = Reflect.get(stream, '_handle')
  if (
    typeof handle === 'object' && handle !== null && 'setBlocking' in handle
    && typeof handle.setBlocking === 'function'
  ) {
    handle.setBlocking(true)
  }
}

/**
 * Failure handler of the CLI (yargs `.fail()`):
 * - expected user errors ({@link isExpectedCliError}): only the message, exit code 1
 * - otherwise the default behavior of yargs with `showHelpOnFail`: help, the message or error, exit code 1
 */
export function handleCliFailure(
  msg: string | undefined | null,
  err: Error | undefined | null,
  usage: { showHelp(level: string): unknown },
  output: CliFailureOutput = defaultOutput,
): void {
  setBlocking(process.stdout)
  setBlocking(process.stderr)
  if (isExpectedCliError(err)) {
    output.error(k.red(err.message))
    output.exit(1)
    return
  }
  usage.showHelp('error')
  output.error()
  output.error(msg || err)
  output.exit(1)
}
