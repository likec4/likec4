import { describe, expect, it } from 'vitest'
import {
  computedAmazonView,
  computedCloudView,
  computedCloud3levels,
  computedIndexView
} from '../__mocks__/data'
import { dotLayout } from './dotLayout'

describe('dotLayout:', () => {

  it(' computedIndexView', async () => {
    const diagram = await dotLayout(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })

  it(' computedAmazonView', async () => {
    const diagram = await dotLayout(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it(' computedCloud3levels', async () => {
    const diagram = await dotLayout(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it(' computedCloudView', async () => {
    const diagram = await dotLayout(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })
})
