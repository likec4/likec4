import { Builder } from '@likec4/core/builder'
import { describe, expect, it } from 'vitest'
import { type ElementsFilter, indexElements, selectElements } from './elements'

const model = Builder
  .specification({
    elements: {
      actor: { notation: 'Person' },
      system: {},
      component: {},
      database: { style: { color: 'secondary' } },
    },
    tags: { legacy: {} },
  })
  .model(({ actor, system, component, database, rel }, _) =>
    _(
      actor('customer', 'Customer'),
      system('shop', 'Shop'),
      component('shop.web', { title: 'Storefront', technology: 'React' }),
      component('shop.api', { title: 'API', technology: 'Go' }),
      database('shop.db', { title: 'Orders DB', tags: ['legacy'] }),
      system('billing', 'Billing'),
      rel('customer', 'shop.web'),
      rel('shop.web', 'shop.api'),
      rel('shop.api', 'shop.db'),
    )
  )
  .views(({ view, viewOf, $include, $rules }, _) =>
    _(
      view('index', 'Landscape', $rules($include('customer'), $include('shop'))),
      viewOf('shop', 'shop', 'Shop internals', $rules($include('shop.web'), $include('shop.api'))),
    )
  )
  .toLikeC4Model()

const all: ElementsFilter = { kind: null, notInViews: false, search: '', sort: 'name' }

describe('indexElements', () => {
  const index = indexElements(model)
  const byId = (id: string) => index.elements.find(el => el.id === id)

  it('lists the views of each element', () => {
    expect(byId('shop')?.views.map(v => v.title)).toEqual(['Landscape'])
    expect(byId('shop.web')?.views.map(v => v.title)).toEqual(['Shop internals'])
  })

  it('counts only the relationships of the element itself', () => {
    expect(byId('shop.api')).toMatchObject({ incoming: 1, outgoing: 1, parent: 'Shop', technology: 'Go' })
    expect(byId('shop')).toMatchObject({ incoming: 0, outgoing: 0, parent: null })
  })

  it('groups kinds, the most used first, with their notation', () => {
    expect(index.kinds.map(k => [k.kind, k.elements, k.notInViews, k.notation])).toEqual([
      ['component', 2, 0, null],
      ['system', 2, 1, null],
      ['actor', 1, 0, 'Person'],
      ['database', 1, 1, null],
    ])
  })

  it('takes the kind color from the specification', () => {
    const database = index.kinds.find(k => k.kind === 'database')
    expect(database?.color).toBe(model.$styles.colors('secondary').elements.fill)
  })

  it('counts elements that are in no view', () => {
    expect(index.notInViews).toBe(2)
  })
})

describe('selectElements', () => {
  const { elements } = indexElements(model)
  const ids = (filter: Partial<ElementsFilter>) => selectElements(elements, { ...all, ...filter }).map(el => el.id)

  it('sorts by title by default', () => {
    expect(ids({})).toEqual(['shop.api', 'billing', 'customer', 'shop.db', 'shop', 'shop.web'])
  })

  it('filters by kind', () => {
    expect(ids({ kind: 'component' })).toEqual(['shop.api', 'shop.web'])
  })

  it('keeps only elements that are in no view', () => {
    expect(ids({ notInViews: true })).toEqual(['billing', 'shop.db'])
  })

  it('searches title, id, technology and tags, ignoring case', () => {
    expect(ids({ search: 'react' })).toEqual(['shop.web'])
    expect(ids({ search: ' LEGACY ' })).toEqual(['shop.db'])
    expect(ids({ search: 'shop.' })).toEqual(['shop.api', 'shop.db', 'shop.web'])
    expect(ids({ search: 'nothing' })).toEqual([])
  })

  it('sorts by kind, then by title', () => {
    expect(ids({ sort: 'kind' })).toEqual(['customer', 'shop.api', 'shop.web', 'shop.db', 'billing', 'shop'])
  })

  it('puts the most connected elements first', () => {
    expect(ids({ sort: 'relationships' }).slice(0, 2)).toEqual(['shop.api', 'shop.web'])
  })
})
