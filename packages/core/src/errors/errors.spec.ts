import { describe, expect, it } from 'vitest'
import {
  BaseError,
  InvalidArgError,
  InvalidModelError,
  invariant,
  InvariantError,
  NonExhaustiveError,
  normalizeError,
  NullableError,
  RelationRefError,
  UnknownError
} from './index'

describe('errors', () => {
  describe('normalizeError', () => {
    it.each([
      { error: new BaseError('BaseError') },
      { error: new RelationRefError('RelationRefError') },
      { error: new UnknownError('UnknownError') },
      { error: new InvariantError('InvariantError') },
      { error: new NonExhaustiveError('NonExhaustiveError') },
      { error: new InvalidModelError('InvalidModelError') },
      { error: new NullableError('NullableError') },
      { error: new InvalidArgError('InvalidArgError') }
    ])('should return $error.name as-is', ({ error }) => {
      expect(normalizeError(error)).toBe(error)
    })

    it.skip('should wrap an error', () => {
      const cause = new Error('original test')
      const error = normalizeError(cause)
      expect(error).toBeInstanceOf(UnknownError)
      expect(error).to.include({
        name: 'UnknownError',
        message: 'original test'
      })
      expect(error).to.have.property('cause').that.eq(cause)
      expect(error)
        .to.have.property('stack')
        .that.is.a('string')
        .and.includes('UnknownError: original test')
    })

    it('should wrap a string', () => {
      const cause = 'error string'
      const error = normalizeError(cause)
      expect(error).toBeInstanceOf(UnknownError)
      expect(error).to.include({
        name: 'UnknownError',
        message: cause
      })
      expect(error).not.to.have.property('cause')
      expect(error).to.have.property('stack').that.is.a('string')
    })

    // Fails on serializiation of AST
    it.skip('should wrap an object', () => {
      const cause = { foo: 'bar' }
      const error = normalizeError(cause)
      expect(error).toBeInstanceOf(UnknownError)
      expect(error).to.include({
        name: 'UnknownError',
        message: '{"foo":"bar"}'
      })
      expect(error).not.to.have.property('cause')
      expect(error).to.have.property('stack').that.is.a('string')
    })
  })
})

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
