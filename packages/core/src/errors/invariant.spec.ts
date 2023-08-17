import { describe, expect, it } from 'vitest'
import { InvariantError, invariant } from './invariant'

describe('invariant', () => {
  it('should throw an error if the condition fails', () => {
    expect(() => invariant(false)).toThrow('Invariant failed')
  })

  it('should throw an error if the condition is null', () => {
    expect(() => invariant(null)).toThrow(InvariantError)
  })

  it('should not throw an error if the condition passes', () => {
    expect(() => invariant(true)).not.toThrow()
  })

  it('should throw an error with the provided message if the condition fails', () => {
    expect(() => invariant(false, 'test')).toThrow('test')
  })
})
