import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

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

async function search(pair: Awaited<ReturnType<typeof createMCPTestPair>>, query: string) {
  const result = await pair.client.callTool({
    name: 'search-element',
    arguments: { search: query },
  })
  return structured(result) as { total: number; found: Array<any> }
}

describe('search-element tool', () => {
  it('returns description, null when absent', async () => {
    await using pair = await createMCPTestPair(DSL)

    const { found } = await search(pair, 'kind:system')
    const fe = found.find(e => e.id === 'frontend')
    const be = found.find(e => e.id === 'backend')
    expect(fe.description).toBe('Renders the checkout page')
    expect(be.description).toBeNull()
  })

  it('fuzzy-matches description, case-insensitive and with typos', async () => {
    await using pair = await createMCPTestPair(DSL)

    for (const query of ['CHECKOUT', 'chekout']) {
      const { found } = await search(pair, query)
      expect(found.map(e => [e.type, e.id])).toEqual(expect.arrayContaining([
        ['element', 'frontend'],
        ['deployment-node', 'prod'],
      ]))
    }
  })

  it('ranks a title match above description matches', async () => {
    await using pair = await createMCPTestPair(DSL)

    const { total, found } = await search(pair, 'checkout')
    expect(total).toBe(3)
    expect(found[0].id).toBe('checkout')
    expect(found[1].description).toMatch(/checkout/)
  })

  it('requires every word to match', async () => {
    await using pair = await createMCPTestPair(DSL)

    expect((await search(pair, 'checkout page')).found.map(e => e.id)).toEqual(['frontend'])
    expect((await search(pair, 'checkout zebra')).total).toBe(0)
  })

  it('does not match description for prefixed searches', async () => {
    await using pair = await createMCPTestPair(DSL)

    expect((await search(pair, 'kind:checkout')).total).toBe(0)
    expect((await search(pair, '#checkout')).total).toBe(0)
  })

  it.each(['store front web', 'store-front-web', 'Store_Front.Web'])(
    'treats separators as word breaks: %s',
    async query => {
      await using pair = await createMCPTestPair(DSL)

      const { found } = await search(pair, query)
      expect(found.map(e => e.id)).toEqual(['storefront_webapp'])
    },
  )

  it('matches link path segments, except the first', async () => {
    await using pair = await createMCPTestPair(DSL)

    expect((await search(pair, 'acme-store-admin')).found.map(e => e.id)).toEqual(['admin'])
    expect((await search(pair, 'platform')).found.map(e => e.id)).toEqual(['worker'])
    expect((await search(pair, 'github')).total).toBe(0)
  })

  it('combines conditions, all must match', async () => {
    await using pair = await createMCPTestPair(DSL)

    expect((await search(pair, 'kind:system #public')).found.map(e => e.id)).toEqual(['frontend'])
    expect((await search(pair, '#public #internal')).found.map(e => e.id)).toEqual(['frontend'])
    expect((await search(pair, 'kind:node #internal')).total).toBe(0)
  })

  it('fuzzy-matches the remaining words within the filtered elements', async () => {
    await using pair = await createMCPTestPair(DSL)

    const { found } = await search(pair, 'kind:system checkout')
    expect(found.map(e => e.id)).toEqual(['checkout', 'frontend'])
  })

  it('ranks an element above children that match only by parent id', async () => {
    await using pair = await createMCPTestPair(DSL)

    const { found } = await search(pair, 'shop')
    expect(found.map(e => e.id)).toEqual(['shop', 'shop.cart'])
  })
})
