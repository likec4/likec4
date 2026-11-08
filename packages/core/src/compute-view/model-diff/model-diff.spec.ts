import { values } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { LikeC4Model } from '../../model'
import type { ModelDiff, ParsedLikeC4ModelData, ParsedView } from '../../types'
import { _stage, _type, DiffId, ViewId } from '../../types'
import { computeAdhocView } from '../adhoc-view/compute'
import { applyModelDiff } from './apply-model-diff'
import {
  computeCompareView,
  computeCompareViews,
  createCompareModels,
  filterCompareView,
  withoutDiffOnlyReferences,
} from './compare-view'
import { computeRemovalImpact, markRemovalImpact, removalImpactViewPredicates } from './removal-impact'
import { sanitizeParsedView } from './sanitize'

const builder = Builder
  .specification({
    elements: {
      actor: {},
      system: {},
      component: {},
    },
    deployments: {
      nd: {},
    },
    tags: {
      next: {},
    },
  })
  .model(({ actor, system, component, rel }, _) =>
    _(
      actor('customer'),
      system('cloud'),
      component('cloud.api'),
      component('cloud.legacy'),
      component('cloud.legacy.db'),
      component('cloud.audit'),
      rel('customer', 'cloud.api', { title: 'uses' }),
      rel('customer', 'cloud.legacy', { title: 'uses legacy' }),
      rel('cloud.api', 'cloud.legacy.db', { title: 'reads' }),
      rel('cloud.legacy', 'cloud.audit', { title: 'logs' }),
    )
  )
  .deployment(({ nd, instanceOf }, _) =>
    _(
      nd('prod').with(
        instanceOf('cloud.api'),
        instanceOf('cloud.legacy'),
      ),
      nd('legacyzone').with(
        instanceOf('cloud.legacy.db'),
      ),
    )
  )
  .views(({ view, viewOf, $include }, _) =>
    _(
      view('index', $include('*')),
      view('customerOnly', $include('customer')),
      viewOf('cloud', 'cloud', $include('*')),
      viewOf('legacy', 'cloud.legacy', $include('*')),
    )
  )

function modelData(): ParsedLikeC4ModelData {
  const data: ParsedLikeC4ModelData = builder.build()
  const customerToApi = values(data.relations).find(r => r.title === 'uses')!
  const diff: ModelDiff = {
    id: DiffId('rfc1'),
    title: 'Replace legacy',
    remove: {
      elements: ['cloud.legacy'],
      relations: [customerToApi.id],
    },
    add: {
      elements: {
        'cloud.payments': {
          id: 'cloud.payments',
          kind: 'component',
          title: 'Payments',
          style: {},
        },
        'ghost.child': {
          id: 'ghost.child',
          kind: 'component',
          title: 'Parent does not exist',
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
    modify: {
      elements: {
        'cloud.api': { tags: ['next'] },
      },
    },
  } as unknown as ModelDiff
  return {
    ...data,
    diffs: { [diff.id]: diff },
  }
}

describe('applyModelDiff', () => {
  const data = modelData()
  const after = applyModelDiff(data, data.diffs!['rfc1' as DiffId]!)

  it('removes elements with their descendants', () => {
    expect(Object.keys(after.elements)).not.toContain('cloud.legacy')
    expect(Object.keys(after.elements)).not.toContain('cloud.legacy.db')
  })

  it('adds elements if the parent exists', () => {
    expect(Object.keys(after.elements)).toContain('cloud.payments')
    expect(Object.keys(after.elements)).not.toContain('ghost.child')
  })

  it('applies overlays to existing elements', () => {
    expect(after.elements['cloud.api']?.tags).toEqual(['next'])
  })

  it('removes relationships of removed elements and explicitly removed relationships', () => {
    expect(values(after.relations).map(r => r.title)).toEqual(['pays'])
  })

  it('removes deployed instances of removed elements', () => {
    expect(Object.keys(after.deployments.elements).sort()).toEqual(['legacyzone', 'prod', 'prod.api'])
  })

  it('keeps the model before the diff unchanged', () => {
    expect(Object.keys(data.elements)).toContain('cloud.legacy')
  })
})

describe('sanitizeParsedView', () => {
  const isMissing = (fqn: string) => fqn === 'missing' || fqn.startsWith('missing.')

  it('returns null for views scoped to a missing element', () => {
    const view = {
      [_type]: 'element',
      [_stage]: 'parsed',
      id: ViewId('v'),
      title: null,
      description: null,
      viewOf: 'missing',
      rules: [],
    } as unknown as ParsedView
    expect(sanitizeParsedView(view, isMissing)).toBeNull()
  })

  it('drops expressions and predicates referencing missing elements', () => {
    const view = {
      [_type]: 'element',
      [_stage]: 'parsed',
      id: ViewId('v'),
      title: null,
      description: null,
      rules: [
        { include: [{ ref: { model: 'a' } }, { ref: { model: 'missing' } }] },
        { include: [{ source: { ref: { model: 'a' } }, target: { ref: { model: 'missing.child' } } }] },
        { exclude: [{ wildcard: true }] },
      ],
    } as unknown as ParsedView
    expect(sanitizeParsedView(view, isMissing)).toMatchObject({
      rules: [
        { include: [{ ref: { model: 'a' } }] },
        { exclude: [{ wildcard: true }] },
      ],
    })
  })

  it('drops dynamic view steps with missing endpoints', () => {
    const view = {
      [_type]: 'dynamic',
      [_stage]: 'parsed',
      id: ViewId('d'),
      title: null,
      description: null,
      rules: [],
      steps: [
        { source: 'a', target: 'b', astPath: '/s1' },
        { source: 'a', target: 'missing', astPath: '/s2' },
        { [_type]: 'par', steps: [{ source: 'missing', target: 'b', astPath: '/s3' }] },
      ],
    } as unknown as ParsedView
    expect(sanitizeParsedView(view, isMissing)).toMatchObject({
      steps: [{ source: 'a', target: 'b' }],
    })
  })
})

describe('computeCompareView', () => {
  const data = modelData()
  const models = createCompareModels(data, DiffId('rfc1'))!

  const compare = (viewId: string) => computeCompareView(data.views[viewId as ViewId]!, models)!

  it('marks added, removed and modified nodes', () => {
    const { view, isAffected } = compare('cloud')
    const status = Object.fromEntries(view.nodes.map(n => [n.id, n.diffStatus ?? null]))
    expect(isAffected).toBe(true)
    expect(status).toMatchObject({
      'cloud.legacy': 'removed',
      'cloud.payments': 'added',
      'cloud.api': 'modified',
    })
  })

  it('marks added and removed edges', () => {
    const { view } = compare('cloud')
    const edges = view.edges.map(e => `${e.source}->${e.target}:${e.diffStatus ?? 'unchanged'}`)
    expect(edges).toContain('customer->cloud.payments:added')
    expect(edges).toContain('customer->cloud.legacy:removed')
  })

  it('keeps node links consistent', () => {
    const { view } = compare('cloud')
    const ids = new Set(view.nodes.map(n => n.id))
    const linked = view.nodes.flatMap(node => [...node.children, ...(node.parent ? [node.parent] : [])])
    for (const id of linked) {
      expect(ids).toContain(id)
    }
    for (const edge of view.edges) {
      expect(ids).toContain(edge.source)
      expect(ids).toContain(edge.target)
    }
  })

  it('marks all nodes of a view scoped to a removed element as removed', () => {
    const { view } = compare('legacy')
    expect(view.nodes.length).toBeGreaterThan(0)
    expect(view.nodes.every(n => n.diffStatus === 'removed')).toBe(true)
  })

  it('reports unaffected views', () => {
    expect(compare('customerOnly').isAffected).toBe(false)
    const affected = computeCompareViews(data, models).filter(r => r.isAffected).map(r => r.view.id)
    expect(affected).not.toContain('customerOnly')
    expect(affected).toContain('cloud')
  })

  it('filters the view by mode', () => {
    const { view } = compare('cloud')
    const asIs = filterCompareView(view, 'as-is')
    const toBe = filterCompareView(view, 'to-be')
    expect(asIs.nodes.map(n => n.id)).toContain('cloud.legacy')
    expect(asIs.nodes.map(n => n.id)).not.toContain('cloud.payments')
    expect(toBe.nodes.map(n => n.id)).toContain('cloud.payments')
    expect(toBe.nodes.map(n => n.id)).not.toContain('cloud.legacy')
    expect([...asIs.nodes, ...toBe.nodes].some(n => n.diffStatus || n.diffBefore)).toBe(false)
    expect(filterCompareView(view, 'changes')).toBe(view)
  })

  it('shows modified nodes as they were before the diff in the as-is mode', () => {
    const { view } = compare('cloud')
    const api = (mode: 'as-is' | 'to-be') => filterCompareView(view, mode).nodes.find(n => n.id === 'cloud.api')
    expect(api('as-is')?.tags).toEqual([])
    expect(api('to-be')?.tags).toEqual(['next'])
  })

  it('removes references to diff-only elements from views before the diff', () => {
    const view = {
      [_type]: 'element',
      [_stage]: 'parsed',
      id: ViewId('rfc'),
      title: null,
      description: null,
      rules: [{ include: [{ ref: { model: 'cloud.payments' } }, { ref: { model: 'customer' } }] }],
    } as unknown as ParsedView
    expect(withoutDiffOnlyReferences(view, data)).toMatchObject({
      rules: [{ include: [{ ref: { model: 'customer' } }] }],
    })
  })
})

describe('computeRemovalImpact', () => {
  const model = builder.toLikeC4Model()
  const impact = computeRemovalImpact(model, ['cloud.legacy'])

  it('collects removed elements and relationships', () => {
    expect([...impact.elements].sort()).toEqual(['cloud.legacy', 'cloud.legacy.db'])
    expect(impact.relations).toHaveLength(3)
  })

  it('collects deployed instances and empty deployment nodes', () => {
    expect([...impact.deployedInstances].sort()).toEqual(['legacyzone.db', 'prod.legacy'])
    expect(impact.emptyDeploymentNodes).toEqual(['legacyzone'])
  })

  it('collects affected and scoped views', () => {
    expect(impact.scopedViews).toEqual(['legacy'])
    expect(impact.affectedViews).toContain('cloud')
    expect(impact.affectedViews).toContain('index')
    expect(impact.affectedViews).not.toContain('customerOnly')
  })

  it('suggests orphans, but not ancestors or still connected elements', () => {
    expect(impact.orphans).toEqual(['cloud.audit'])
  })

  it('marks the impact view', () => {
    const view = markRemovalImpact(computeAdhocView(model, removalImpactViewPredicates(model, impact)), impact)
    const status = Object.fromEntries(view.nodes.map(n => [n.id, n.diffStatus ?? null]))
    expect(status).toMatchObject({
      'cloud.legacy': 'removed',
      'cloud.legacy.db': 'removed',
      'cloud.audit': 'orphan',
      'customer': null,
    })
    expect(view.edges.some(e => e.diffStatus === 'removed')).toBe(true)
  })

  it('ignores unknown targets', () => {
    expect(computeRemovalImpact(model, ['unknown']).elements).toEqual([])
  })

  it('works with a parsed model', () => {
    const parsed = LikeC4Model.create(builder.build())
    expect(computeRemovalImpact(parsed, ['cloud.legacy']).orphans).toEqual(['cloud.audit'])
  })
})
