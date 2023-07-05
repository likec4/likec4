/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TestFunction} from 'vitest';
import { vi, test as viTest } from 'vitest'
import '../../logger'
import { createTestServices } from '../../test'
import stripIndent from 'strip-indent'
vi.mock('../../logger')

export function likec4(strings: TemplateStringsArray, ...expr: string[]) {
  const result = ['']
  for (let i = 0; i < strings.length; i++) {
    result.push(strings[i]!)
    if (i < expr.length) {
      result.push(expr[i]!)
    }
  }
  return stripIndent(result.join(''))
}

export const valid = (strings: TemplateStringsArray, ...expr: string[]): TestFunction =>
  async ({expect}) => {
    expect.hasAssertions()
    const { validate } = createTestServices()
    const { diagnostics } = await validate(likec4(strings, ...expr))
    const errors = diagnostics.map(d => d.message).join('\n')
    expect(errors).to.be.empty
  }

export const invalid = (strings: TemplateStringsArray, ...expr: string[]): TestFunction =>
  async ({expect}) => {
    expect.hasAssertions()
    const { validate } = createTestServices()
    const { diagnostics } = await validate(likec4(strings, ...expr))
    const errors = diagnostics.map(d => d.message).join('\n')
    expect(errors).not.to.be.empty
  }

const runValidTest = valid
const runInvalidTest = invalid

export function test(name: string) {
  return {
    valid: (strings: TemplateStringsArray, ...expr: string[]) => {
      viTest.concurrent(`valid: ${name}`, runValidTest(strings, ...expr))
    },
    invalid: (strings: TemplateStringsArray, ...expr: string[]) => {
      viTest.concurrent(`invalid: ${name}`, runInvalidTest(strings, ...expr))
    }
  }
}
