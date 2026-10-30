import { describe, expect, it } from 'vitest'
import { createFuzzySearch } from './fuzzy'

interface Item {
  name: string
  title: string
}

const items: Item[] = [
  { name: 'cloud', title: 'Cloud platform' },
  { name: 'checkout', title: 'Checkout service' },
  { name: 'payments', title: 'Payments API' },
  { name: 'store-front', title: 'Store front web' },
]

const search = createFuzzySearch(items, [
  { name: 'name', getFn: item => item.name },
  { name: 'title', getFn: item => item.title },
])

const names = (found: Item[]) => found.map(item => item.name)

describe('createFuzzySearch', () => {
  it('finds items by a part of any key', () => {
    expect(names(search('payments'))).toEqual(['payments'])
    expect(names(search('service'))).toEqual(['checkout'])
  })

  it('is case-insensitive', () => {
    expect(names(search('CHECKOUT'))).toEqual(['checkout'])
  })

  it('tolerates a typo', () => {
    expect(names(search('chekout'))).toEqual(['checkout'])
    expect(names(search('paymnts'))).toEqual(['payments'])
  })

  it('requires every word to match, each in any key', () => {
    expect(names(search('checkout service'))).toEqual(['checkout'])
    expect(names(search('checkout api'))).toEqual([])
    expect(names(search('store web'))).toEqual(['store-front'])
  })

  it('splits words the same way as the MCP search', () => {
    expect(names(search('store-front'))).toEqual(['store-front'])
  })

  it('keeps the original order of the items, not the order of relevance', () => {
    const list = [{ name: 'checkout b' }, { name: 'checkout a' }, { name: 'checkout' }] // the best match is the last
    const found = createFuzzySearch(list, [{ name: 'name', getFn: item => item.name }])('checkout')
    expect(found).toEqual(list)
  })

  it('does not treat what the user types as search operators', () => {
    // `!` means "does not contain" in the extended syntax of Fuse
    expect(names(search('!checkout'))).toEqual(['checkout'])
    expect(names(search('\'checkout'))).toEqual(['checkout'])
  })

  it('finds nothing when there is no word to look for', () => {
    expect(search('')).toEqual([])
    expect(search('--')).toEqual([])
  })
})
