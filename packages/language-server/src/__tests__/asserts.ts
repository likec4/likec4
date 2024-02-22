/* eslint-disable @typescript-eslint/no-non-null-assertion */
import stripIndent from 'strip-indent'
import type { TestFunction } from 'vitest'
import { test as viTest } from 'vitest'
import { createTestServices } from '../test'

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
    const { validate } = createTestServices()
    const { diagnostics } = await validate(likec4(strings, ...expr))
    const errors = diagnostics.map(d => d.message).join('\n')
    expect(errors).toEqual('')
  }
}

export function invalid(strings: TemplateStringsArray, ...expr: string[]): TestFunction {
  return async ({ expect }) => {
    expect.hasAssertions()
    const { validate } = createTestServices()
    const { diagnostics } = await validate(likec4(strings, ...expr))
    const errors = diagnostics.map(d => d.message).join('\n')
    expect(errors).not.toEqual('')
  }
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
