import { describe, expect, it } from 'vitest'
import {
  computedAmazonView,
  computedCloudView,
  computedCloud3levels,
  computedIndexView
} from './__fixtures__'
import { printToDot } from './printToDot'

describe('printToDot', () => {
  it('computedIndexView', () => {
    expect.hasAssertions()
    const diagram = printToDot(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedAmazonView', () => {
    expect.hasAssertions()
    const diagram = printToDot(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', () => {
    expect.hasAssertions()
    const diagram = printToDot(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', () => {
    expect.hasAssertions()
    const diagram = printToDot(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })
})
