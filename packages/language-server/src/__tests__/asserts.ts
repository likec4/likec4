/* eslint-disable @typescript-eslint/no-non-null-assertion */
import stripIndent from 'strip-indent'
import type { TestFunction } from 'vitest'
import { createTestServices, testFileScope as it } from '../test'

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

export function valid(strings: TemplateStringsArray, ...expr: string[]): TestFunction {
  return async ({ expect }) => {
    expect.hasAssertions()
    using t = createTestServices()
    const { diagnostics } = await t.validate(likec4(strings, ...expr))
    const errors = diagnostics.map(d => d.message).join('\n')
    expect(errors).toEqual('')
  }
}

export function invalid(strings: TemplateStringsArray, ...expr: string[]): TestFunction {
  return async ({ expect }) => {
    expect.hasAssertions()
    using t = createTestServices()
    const { diagnostics } = await t.validate(likec4(strings, ...expr))
    const errors = diagnostics.map(d => d.message).join('\n')
    expect(errors).not.toEqual('')
  }
}

export function test(name: string) {
  return {
    valid: (strings: TemplateStringsArray, ...expr: string[]) => {
      it(`valid: ${name}`, async ({ expect, t }) => {
        const { formattedError } = await t.validate(likec4(strings, ...expr))
        expect(formattedError).toEqual('')
      })
    },
    invalid: (strings: TemplateStringsArray, ...expr: string[]) => {
      it(`invalid: ${name}`, async ({ expect, t }) => {
        const { formattedError } = await t.validate(likec4(strings, ...expr))
        expect(formattedError).not.toEqual('')
      })
    },
  }
}
