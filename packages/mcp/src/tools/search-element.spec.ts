import { describe } from 'vitest'
import { createMCPTest, structured } from '../__tests__/test-utils'

const DSL = `
  specification {
    element system
    deploymentNode node
    tag public
    tag internal
  }
  model {
    frontend = system 'Frontend' {
      #public #internal
      description 'Renders the checkout page'
    }
    backend = system 'Backend'
    checkout = system 'Checkout'
    storefront_webapp = system 'Web-UI' {
      link https://github.com/acme/Store-Front-Web
    }
    admin = system 'Admin-UI' {
      link https://github.com/acme/Acme-Store-Admin.git
    }
    shop = system 'Shop' {
      #internal
      cart = system 'Cart'
    }
    worker = system 'Queue Consumer' {
      link https://github.com/acme/platform/tree/main/worker
    }
  }
  deployment {
    prod = node 'Production' {
      description 'Hosts the checkout cluster'
    }
  }
`

const it = createMCPTest(DSL)
  .extend('search', async ({ callTool }) => {
    return async (query: string) => {
      const result = await callTool.structured<{ total: number; found: Array<any> }>(
        'search-element',
        { search: query },
      )
      return result
    }
  })

describe('search-element tool', () => {
  it('returns description, null when absent', async ({ search, expect }) => {
    const { found } = await search('kind:system')
    const fe = found.find(e => e.id === 'frontend')
    const be = found.find(e => e.id === 'backend')
    expect(fe.description).toBe('Renders the checkout page')
    expect(be.description).toBeNull()
  })

  it('fuzzy-matches description, case-insensitive and with typos', async ({ search, expect }) => {
    for (const query of ['CHECKOUT', 'chekout']) {
      const { found } = await search(query)
      expect(found.map(e => [e.type, e.id])).toEqual(expect.arrayContaining([
        ['element', 'frontend'],
        ['deployment-node', 'prod'],
      ]))
    }
  })

  it('ranks a title match above description matches', async ({ search, expect }) => {
    const { total, found } = await search('checkout')
    expect(total).toBe(3)
    expect(found[0].id).toBe('checkout')
    expect(found[1].description).toMatch(/checkout/)
  })

  it('requires every word to match', async ({ search, expect }) => {
    expect((await search('checkout page')).found.map(e => e.id)).toEqual(['frontend'])
    expect((await search('checkout zebra')).total).toBe(0)
  })

  it('does not match description for prefixed searches', async ({ search, expect }) => {
    expect((await search('kind:checkout')).total).toBe(0)
    expect((await search('#checkout')).total).toBe(0)
  })

  for (const query of ['store front web', 'store-front-web', 'Store_Front.Web']) {
    it(`treats separators as word breaks: ${query}`, async ({ search, expect }) => {
      const { found } = await search(query)
      expect(found.map(e => e.id)).toEqual(['storefront_webapp'])
    })
  }

  it('matches link path segments, except the first', async ({ search, expect }) => {
    expect((await search('acme-store-admin')).found.map(e => e.id)).toEqual(['admin'])
    expect((await search('platform')).found.map(e => e.id)).toEqual(['worker'])
    expect((await search('github')).total).toBe(0)
  })

  it('combines conditions, all must match', async ({ search, expect }) => {
    expect((await search('kind:system #public')).found.map(e => e.id)).toEqual(['frontend'])
    expect((await search('#public #internal')).found.map(e => e.id)).toEqual(['frontend'])
    expect((await search('kind:node #internal')).total).toBe(0)
  })

  it('fuzzy-matches the remaining words within the filtered elements', async ({ search, expect }) => {
    const { found } = await search('kind:system checkout')
    expect(found.map(e => e.id)).toEqual(['checkout', 'frontend'])
  })

  it('ranks an element above children that match only by parent id', async ({ search, expect }) => {
    const { found } = await search('shop')
    expect(found.map(e => e.id)).toEqual(['shop', 'shop.cart'])
  })
})
