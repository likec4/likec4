import { Builder } from '@likec4/core/builder'
import { computeLikeC4Model } from '@likec4/core/compute-view'
import type { LayoutedView, ModelDiff, ParsedLikeC4ModelData } from '@likec4/core/types'
import { _stage, _type, DiffId, ViewId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { compareLookupModel } from './compare-model'

const data = (() => {
  const parsed: ParsedLikeC4ModelData = Builder
    .specification({
      elements: { actor: {}, system: {}, component: {} },
      tags: { next: {} },
    })
    .model(({ actor, system, component, rel }, _) =>
      _(
        actor('customer'),
        system('cloud'),
        component('cloud.api'),
        component('cloud.legacy'),
        rel('customer', 'cloud.api', { title: 'uses' }),
        rel('customer', 'cloud.legacy', { title: 'uses legacy' }),
      )
    )
    .views(({ view, $include }, _) => _(view('index', $include('*'))))
    .build()
  const uses = Object.values(parsed.relations).find(relation => relation.title === 'uses')!
  const diff = {
    id: DiffId('rfc1'),
    title: 'Replace legacy',
    remove: { elements: ['cloud.legacy'], relations: [uses.id] },
    add: {
      elements: {
        'cloud.payments': {
          id: 'cloud.payments',
          kind: 'component',
          title: 'Payments',
          style: {},
        },
      },
      relations: {
        'diff-rel-1': {
          id: 'diff-rel-1',
          source: { model: 'customer' },
          target: { model: 'cloud.payments' },
          title: 'pays',
        },
      },
    },
    modify: { elements: { 'cloud.api': { tags: ['next'] } } },
  } as unknown as ModelDiff
  return { ...parsed, diffs: { [diff.id]: diff } }
})()

function lookup(mode: 'as-is' | 'changes' | 'to-be') {
  const before = computeLikeC4Model(data)
  return compareLookupModel(before, {
    diffId: 'rfc1',
    mode,
    view: before.view('index').$view as unknown as LayoutedView,
  })
}

describe('compareLookupModel', () => {
  it('reads added and modified elements from the model after the diff', () => {
    const model = lookup('changes')
    expect(model.element('cloud.payments').title).toBe('Payments')
    expect(model.element('cloud.api').tags).toEqual(['next'])
    expect(model.relationship('diff-rel-1' as never).title).toBe('pays')
  })

  it('reads removed elements from the model before the diff', () => {
    const model = lookup('changes')
    expect(model.element('cloud.legacy').id).toBe('cloud.legacy')
    const removed = Object.values(data.relations).find(relation => relation.title === 'uses')!
    expect(model.findRelationship(removed.id as never)?.title).toBe('uses')
  })

  it('reads the model before the diff in as-is mode', () => {
    const model = lookup('as-is')
    expect(model.findElement('cloud.payments')).toBeNull()
    expect(model.element('cloud.api').tags).toEqual([])
    expect(model.element('cloud.legacy').id).toBe('cloud.legacy')
  })

  it('resolves elements through the compare view model', () => {
    const model = lookup('to-be')
    expect(model.findView('index')?.$model.element('cloud.payments').title).toBe('Payments')
    expect(model.element('cloud.api').tags).toEqual(['next'])
  })

  it('builds the after model when the diff introduces a view', () => {
    const diff = data.diffs[DiffId('rfc1')]!
    const withView = {
      ...data,
      diffs: {
        [diff.id]: {
          ...diff,
          views: {
            [ViewId('pays')]: {
              [_type]: 'dynamic',
              [_stage]: 'parsed',
              id: ViewId('pays'),
              title: 'Pays',
              description: null,
              rules: [],
              steps: [],
            },
          },
        },
      },
    } as unknown as ParsedLikeC4ModelData
    const before = computeLikeC4Model(withView)
    const model = compareLookupModel(before, {
      diffId: 'rfc1',
      mode: 'changes',
      view: before.view('index').$view as unknown as LayoutedView,
    })
    expect(model.element('cloud.payments').title).toBe('Payments')
    expect(model.findView('pays')).toBeNull()
  })
})
