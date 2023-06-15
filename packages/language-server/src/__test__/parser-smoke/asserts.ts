/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TestFunction} from 'vitest';
import { vi } from 'vitest'
import '../../logger'
import { createTestServices } from '../../test'
vi.mock('../../logger')

function documentTpl(strings: TemplateStringsArray, ...expr: string[]) {
  const result = ['']
  for (let i = 0; i < strings.length; i++) {
    result.push(strings[i]!)
    if (i < expr.length) {
      result.push(expr[i]!)
    }
  }
  return result.join('')
}

export const valid = (strings: TemplateStringsArray, ...expr: string[]): TestFunction =>
  async ({expect}) => {
    expect.hasAssertions()
    const { validate } = createTestServices()
    const { diagnostics } = await validate(documentTpl(strings, ...expr))
    const errors = diagnostics.map(d => d.message)
    expect(errors).to.be.empty
  }


export const invalid = (strings: TemplateStringsArray, ...expr: string[]): TestFunction =>
  async ({expect}) => {
    expect.hasAssertions()
    const { validate } = createTestServices()
    const { diagnostics } = await validate(documentTpl(strings, ...expr))
    const errors = diagnostics.map(d => d.message)
    expect(errors).not.to.be.empty
  }
