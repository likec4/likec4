import { expect, test } from 'vitest'
import { commonHead } from './commonHead'

test('commonHead of two empty arrays', () => {
  const sources: number[] = []
  const targets: number[] = []
  const result = commonHead(sources, targets)
  expect(result).toEqual([])
})

test('commonHead of one empty array and one non-empty array', () => {
  const sources = [1, 2, 3]
  const targets: number[] = []
  const result = commonHead(sources, targets)
  expect(result).toEqual([])
})

test('commonHead of two arrays with no common elements', () => {
  const sources = [1, 2, 3]
  const targets = [4, 5, 6]
  const result = commonHead(sources, targets)
  expect(result).toEqual([])
})

test('commonHead of two arrays with some common elements at the start', () => {
  const sources = [1, 2, 3, 4]
  const targets = [1, 2, 5, 6]
  const result = commonHead(sources, targets)
  expect(result).toEqual([1, 2])
})

test('commonHead of two arrays with some common object elements at the start', () => {
  const A = { a: 1 }, B = { b: 2 }
  const sources = [A, B, { c: 3 }]
  const targets = [A, B, { d: 4 }]
  const result = commonHead<unknown>(sources, targets)
  expect(result).toEqual([A, B])
})

test('commonHead of two arrays with all elements in common', () => {
  const sources = [1, 2, 3]
  const targets = [1, 2, 3]
  const result = commonHead(sources, targets)
  expect(result).toEqual([1, 2, 3])
})

test('commonHead with custom equality function', () => {
  const sources: string[] = ['apple', 'banana', 'cherry']
  const targets: string[] = ['APPLE', 'BANANA', 'DATE']
  const equals = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
  const result = commonHead(sources, targets, equals)
  expect(result).toEqual(['apple', 'banana'])
})
