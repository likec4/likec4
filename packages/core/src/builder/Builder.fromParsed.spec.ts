import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

const seedSpec = Builder.specification({
  elements: {
    actor: {
      style: { shape: 'person' },
    },
    system: {},
    component: {},
  },
  relationships: {
    like: {
      technology: 'thumbs up',
    },
    api: {},
  },
  deployments: ['env', 'node'],
  tags: {
    tag1: { color: '#FFF' },
    tag2: {},
  },
})

const seedBuilder = seedSpec
  .model(({ system, actor, component, rel }, _) =>
    _(
      actor('customer', { tags: ['tag1'] }),
      system('cloud').with(
        component('ui'),
        component('api', {
          title: 'Original',
        }),
      ),
      rel('customer', 'cloud.ui', { kind: 'like' }),
      rel('cloud.ui', 'cloud.api', { kind: 'api' }),
    )
  )
  .deployment(({ env, node, instanceOf }, _) =>
    _(
      env('prod').with(
        node('eu').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.api'),
        ),
      ),
    )
  )
  .views(({ view, viewOf, deploymentView, $include }, _) =>
    _(
      view('index', 'Index').with(
        $include('cloud.*'),
      ),
      viewOf('cloud-ui', 'cloud.ui').with(
        $include('* -> cloud.**'),
      ),
      deploymentView('prod', 'Prod').with(
        $include('prod.**'),
      ),
    )
  )

describe('Builder.fromParsed', () => {
  it('round-trips elements, relations, views and deployments', () => {
    const original = seedBuilder.build()
    const seeded = Builder.fromParsed(original)
    const rebuilt = seeded.build()

    expect(rebuilt.elements, 'elements').toEqual(original.elements)
    expect(rebuilt.relations, 'relations').toEqual(original.relations)
    expect(rebuilt.views, 'views').toEqual(original.views)
    expect(rebuilt.deployments.elements, 'deployment elements').toEqual(original.deployments.elements)
    expect(rebuilt.deployments.relations, 'deployment relations').toEqual(original.deployments.relations)
  })

  it('preserves the specification (kinds, tags, deployments, relationships)', () => {
    const original = seedBuilder.build()
    const rebuilt = Builder.fromParsed(original).build()

    expect(Object.keys(rebuilt.specification.elements ?? {}).sort()).toEqual(
      Object.keys(original.specification.elements ?? {}).sort(),
    )
    expect(Object.keys(rebuilt.specification.deployments ?? {}).sort()).toEqual(
      Object.keys(original.specification.deployments ?? {}).sort(),
    )
    expect(Object.keys(rebuilt.specification.relationships ?? {}).sort()).toEqual(
      Object.keys(original.specification.relationships ?? {}).sort(),
    )
    expect(Object.keys(rebuilt.specification.tags ?? {}).sort()).toEqual(
      Object.keys(original.specification.tags ?? {}).sort(),
    )
  })

  it('preserves globals', () => {
    const original = seedBuilder.build()
    const rebuilt = Builder.fromParsed(original).build()

    expect(rebuilt.globals).toEqual(original.globals)
  })

  it('returns a builder that can extend existing elements and views', () => {
    const original = seedBuilder.build()
    const enriched = Builder
      .fromParsed<typeof seedSpec['Types']>(original)
      .model(({ system, component }, _) =>
        _(
          system('monitoring').with(
            component('grafana'),
          ),
        )
      )
      .views(({ view, $include }, _) =>
        _(
          view('monitoring', 'Monitoring').with(
            $include('monitoring.*'),
          ),
        )
      )
      .build()

    expect(enriched.elements).toMatchObject({
      'cloud': { id: 'cloud' },
      'cloud.ui': { id: 'cloud.ui' },
      'cloud.api': { id: 'cloud.api', title: 'Original' },
      'monitoring': { id: 'monitoring' },
      'monitoring.grafana': { id: 'monitoring.grafana' },
    })
    expect(enriched.views).toMatchObject({
      'index': { id: 'index' },
      'monitoring': { id: 'monitoring' },
    })
  })

  it('returns a builder that can extend existing elements', () => {
    const original = seedBuilder.build()
    const enriched = Builder
      .fromParsed<typeof seedSpec['Types']>(original)
      .model(({ component }, _) =>
        _(
          component('cloud.ui.react'),
        )
      )
      .build()

    expect(enriched.elements).toMatchObject({
      'cloud': { id: 'cloud' },
      'cloud.ui': { id: 'cloud.ui' },
      'cloud.api': { id: 'cloud.api', title: 'Original' },
      'cloud.ui.react': { id: 'cloud.ui.react' },
    })
  })

  it('returns a builder that can edit existing elements in editable mode (default)', () => {
    const original = seedBuilder.build()
    const enriched = Builder
      .fromParsed<typeof seedSpec['Types']>(original)
      .model(({ component, system }, _) =>
        _(
          component('cloud.api', { title: 'Updated' }),
          system('cloud').with(
            component('ui', { title: 'Changed' }),
          ),
        )
      )
      .build()

    expect(enriched.elements).toMatchObject({
      'cloud': { id: 'cloud' },
      'cloud.ui': { id: 'cloud.ui', title: 'Changed' },
      'cloud.api': { id: 'cloud.api', title: 'Updated' },
    })
  })

  it('throws when re-declaring an existing element in strict mode', () => {
    const original = seedBuilder.build()
    expect(() =>
      Builder
        .fromParsed<typeof seedSpec['Types']>(original, 'strict')
        .model(({ component }, _) =>
          _(
            component('cloud.api', { title: 'Updated' }),
          )
        )
        .build()
    ).toThrow(/already exists/)
  })

  it('cross-references to seeded FQNs work at runtime via helpers()', () => {
    // TS cannot prove disk-loaded FQNs exist, so the strongly-typed `.model(...)`
    // callback rejects them. Callers can still reach them via `helpers()` which
    // is loosely typed at the value level — the relation is still validated at
    // runtime against the seeded elements.
    const original = seedBuilder.build()
    const seeded = Builder.fromParsed(original)
    const { rel, model } = seeded.helpers().model
    const enriched = seeded.with(
      model(rel('cloud.api' as never, 'cloud.ui' as never, { title: 'depends on' } as never)),
    ).build()
    const added = Object.values(enriched.relations).find(r => (r as { title?: string }).title === 'depends on')
    expect(added, 'cross-ref relation appended at runtime').toBeDefined()
  })

  it('seeded builder can compute LikeC4Model', () => {
    const original = seedBuilder.build()
    const model = Builder.fromParsed(original).toLikeC4Model()
    expect(model.element('cloud.ui').id).toBe('cloud.ui')
    expect(model.view('index').id).toBe('index')
  })

  it('specification(spec) merges new kinds into a seeded builder', () => {
    const original = seedBuilder.build()
    const enriched = Builder
      .fromParsed<typeof seedSpec['Types']>(original)
      .specification({
        elements: {
          // new kind, plus override of `system` style
          database: { style: { shape: 'storage' } },
          system: { style: { shape: 'rectangle' } },
        },
        tags: {
          // new tag
          experimental: { color: '#f00' },
        },
      })
      .model(({ database }, _) =>
        _(
          database('warehouse', { tags: ['experimental'] }),
        )
      )
      .build()

    // Original kinds preserved
    expect(Object.keys(enriched.specification.elements ?? {}).sort()).toEqual([
      'actor',
      'component',
      'database',
      'system',
    ])
    // Original tags preserved + new tag added
    expect(Object.keys(enriched.specification.tags ?? {}).sort()).toEqual([
      'experimental',
      'tag1',
      'tag2',
    ])
    // New kind usable in model
    expect(enriched.elements).toMatchObject({
      'warehouse': { id: 'warehouse', kind: 'database', tags: ['experimental'] },
    })
  })
})
