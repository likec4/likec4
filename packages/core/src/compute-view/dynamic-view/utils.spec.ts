import { indexBy, mapValues, pipe, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import type { LikeC4Model } from '../../model'
import type { StepPath, ViewId } from '../../types'
import { findRelations, flowAncestors } from './utils'

const viewId = 'index' as ViewId<'index'>

const sp = (path: string) => path as StepPath

const specs = Builder
  .specification({
    elements: {
      el: {},
    },
    relationships: {
      requests: {
        technology: 'HTTP Request',
      },
    },
    tags: {},
  })

const baseModel = specs
  .model(({ el }, _) =>
    _(
      el('a').with(
        el('child1'),
        el('child2'),
      ),
      el('b').with(
        el('child1'),
        el('child2'),
      ),
      el('shopify'),
      el('webhook'),
    )
  )
  .views(({ view, $include }, _) =>
    _(
      view('index', $include('*')),
    )
  )

describe('findRelations', () => {
  const testFindRelationsOnModel = (model: LikeC4Model<any>) => {
    const a = model.element('a')
    const b = model.element('b')
    return findRelations(a, b, viewId)
  }

  it('should return empty object when no relationships found', () => {
    const model = baseModel.toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toEqual({})
  })

  it('should return single relationship properties including technology and description', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('shopify', 'webhook', {
            title: 'requests',
            technology: 'HTTP Request Override',
            description: { txt: 'Makes HTTP request' },
            color: 'blue',
            line: 'solid',
          }),
        )
      )
      .toLikeC4Model()
    const shopify = model.element('shopify')
    const webhook = model.element('webhook')

    const result = findRelations(shopify, webhook, viewId)

    expect(result).toMatchObject({
      title: 'requests',
      technology: 'HTTP Request Override',
      description: { txt: 'Makes HTTP request' },
      color: 'blue',
      line: 'solid',
    })
    expect(result.relations).toHaveLength(1)
  })

  it('should return technology from single relationship even without explicit technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('shopify', 'webhook', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()
    const shopify = model.element('shopify')
    const webhook = model.element('webhook')

    const result = findRelations(shopify, webhook, viewId)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
    })
  })

  it('should return technology when all relationships have same technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            technology: 'REST',
          }),
          rel('a.child2', 'b.child2', {
            technology: 'REST',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      technology: 'REST',
    })
    expect(result.relations).toHaveLength(2)
  })

  it('should not return technology when multiple relationships have different technologies', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            technology: 'REST',
          }),
          rel('a.child2', 'b.child2', {
            technology: 'GraphQL',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).not.toHaveProperty('technology')
    expect(result.relations).toHaveLength(2)
  })

  it('should return description when all relationships have same description', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            description: { txt: 'Same description' },
          }),
          rel('a.child2', 'b.child2', {
            description: { txt: 'Same description' },
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      description: { txt: 'Same description' },
    })
    expect(result.relations).toHaveLength(2)
  })

  it('should not return description when multiple relationships have different descriptions', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            description: { txt: 'Description 1' },
          }),
          rel('a.child2', 'b.child2', {
            description: { txt: 'Description 2' },
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).not.toHaveProperty('description')
    expect(result.relations).toHaveLength(2)
  })

  it('should handle mixed explicit and spec-based technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a', 'b', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
      kind: 'requests',
    })
  })

  it('should return technology when multiple relationships have same technology from spec', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            kind: 'requests',
          }),
          rel('a.child2', 'b.child2', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
      kind: 'requests',
    })
    expect(result.relations).toHaveLength(2)
  })
})

describe('flowAncestors', () => {
  it('should return valid ancestors from computed model', () => {
    const view = baseModel
      .views(({ dynamicView, $step }, _) =>
        _(
          dynamicView('dynview').with(
            $step('a.child1 -> a.child2'),
            $step.alt(
              $step.when(
                $step.try({
                  try: [
                    $step('a.child2 -> b.child1'),
                  ],
                  catch: [
                    $step('a.child2 -> b.child2'),
                  ],
                  finally: [
                    $step.loop(
                      $step('a.child2 -> b.child2'),
                    ),
                  ],
                }),
              ),
            ),
          ),
        )
      )
      .toLikeC4Model()
      .view('dynview')
      .$view
    const edgeAncestors = pipe(
      view.edges,
      indexBy(prop('id')),
      mapValues(e => flowAncestors(e.id)),
    )
    expect(edgeAncestors).toEqual({
      'step-01': [],
      'step-02:alt.01:when.01:try.01:block.01': [
        'step-02:alt',
        'step-02:alt.01:when',
        'step-02:alt.01:when.01:try',
        'step-02:alt.01:when.01:try.01:block',
      ],
      'step-02:alt.01:when.01:try.02:catch.01': [
        'step-02:alt',
        'step-02:alt.01:when',
        'step-02:alt.01:when.01:try',
        'step-02:alt.01:when.01:try.02:catch',
      ],
      'step-02:alt.01:when.01:try.03:finally.01:loop.01': [
        'step-02:alt',
        'step-02:alt.01:when',
        'step-02:alt.01:when.01:try',
        'step-02:alt.01:when.01:try.03:finally',
        'step-02:alt.01:when.01:try.03:finally.01:loop',
      ],
    })
  })

  it('should return empty array for a top-level leaf step', () => {
    expect(flowAncestors(sp('step-04'))).toEqual([])
  })

  it('should return empty array for a top-level flow id (not its own ancestor)', () => {
    expect(flowAncestors(sp('step-01:opt'))).toEqual([])
  })

  it('should return the enclosing flow for a step nested in one subflow', () => {
    expect(flowAncestors(sp('step-01.02:opt.03'))).toEqual([
      'step-01.02:opt',
    ])
  })

  it('should return ancestors ordered from outermost to innermost', () => {
    expect(flowAncestors(sp('step-01.02:opt.03:try.04'))).toEqual([
      'step-01.02:opt',
      'step-01.02:opt.03:try',
    ])
  })

  it('should resolve the full ancestor chain for a deeply nested step', () => {
    expect(flowAncestors(sp('step-01.02:opt.03:try.01:block.04'))).toEqual([
      'step-01.02:opt',
      'step-01.02:opt.03:try',
      'step-01.02:opt.03:try.01:block',
    ])
  })

  it('should exclude the path itself when it is a flow id', () => {
    expect(flowAncestors(sp('step-01.02:opt.03:try'))).toEqual([
      'step-01.02:opt',
    ])
  })

  it('should only treat `:`-bearing segments as flows', () => {
    // Plain step segments (no `:type`) are never ancestors.
    expect(flowAncestors(sp('step-01.02.03'))).toEqual([])
  })
})
