import { ProjectId } from '@likec4/core/types'
import { DependenciesNotInstalledError, InstallTargetNotFoundError } from '@likec4/language-services/node'
import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it, vi } from 'vitest'
import { handleCliFailure } from './fail'

function stubs() {
  const output = {
    error: vi.fn<(...args: unknown[]) => void>(),
    exit: vi.fn<(code: number) => void>(),
  }
  const usage = { showHelp: vi.fn<(level: string) => void>() }
  const printed = () =>
    output.error.mock.calls.map(args => args.map(a => typeof a === 'string' ? stripVTControlCharacters(a) : a))
  return { output, usage, printed }
}

describe('handleCliFailure', () => {
  it('prints only the message of DependenciesNotInstalledError', () => {
    const { output, usage, printed } = stubs()
    const error = new DependenciesNotInstalledError([
      { projectId: ProjectId('cloud'), name: 'billing', source: { git: 'git@github.com:org/billing.git', ref: 'v1' } },
    ])
    handleCliFailure(undefined, error, usage, output)
    expect(usage.showHelp).not.toHaveBeenCalled()
    expect(printed()).toEqual([[
      [
        'Dependency is not installed:',
        `  - 'billing' of project 'cloud' (git@github.com:org/billing.git#v1)`,
        'Run `likec4 install` to install it.',
      ].join('\n'),
    ]])
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('prints only the message of InstallTargetNotFoundError', () => {
    const { output, usage, printed } = stubs()
    handleCliFailure(undefined, new InstallTargetNotFoundError('project', `Project 'nope' not found`), usage, output)
    expect(usage.showHelp).not.toHaveBeenCalled()
    expect(printed()).toEqual([[`Project 'nope' not found`]])
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('shows help and the error otherwise (default of yargs)', () => {
    const { output, usage } = stubs()
    const error = new Error('project not found: nope')
    handleCliFailure(undefined, error, usage, output)
    expect(usage.showHelp).toHaveBeenCalledExactlyOnceWith('error')
    expect(output.error.mock.calls).toEqual([[], [error]])
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('shows help and the message of a validation failure', () => {
    const { output, usage } = stubs()
    handleCliFailure('Please run with valid command', undefined, usage, output)
    expect(usage.showHelp).toHaveBeenCalledExactlyOnceWith('error')
    expect(output.error.mock.calls).toEqual([[], ['Please run with valid command']])
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1)
  })
})
