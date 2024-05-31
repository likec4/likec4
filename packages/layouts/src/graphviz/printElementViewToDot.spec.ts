import { describe, expect, it } from 'vitest'
import { computedAmazonView, computedCloud3levels, computedCloudView, computedIndexView } from './__fixtures__'
import { printElementViewToDot } from './printElementViewToDot'

describe('printElementViewToDot', () => {
  it('computedIndexView', () => {
    const diagram = printElementViewToDot(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedAmazonView', () => {
    const diagram = printElementViewToDot(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', () => {
    const diagram = printElementViewToDot(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', () => {
    const diagram = printElementViewToDot(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })
})
