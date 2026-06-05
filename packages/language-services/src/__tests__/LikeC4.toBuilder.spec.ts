import { vol } from 'memfs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fromSource, writeDSL } from '../node/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const sampleSource = `
  specification {
    element actor {
      style {
        shape person
      }
    }
    element system
    element component
  }
  model {
    customer = actor 'Customer'
    cloud = system {
      backend = component
      frontend = component
    }
    customer -> cloud.frontend
    cloud.frontend -> cloud.backend
  }
  views {
    view index {
      include *
    }
  }
`

describe('LikeC4.toBuilder / toDSL / writeDSL', () => {
  it('exposes the parsed model via parsedModel()', async () => {
    const likec4 = await fromSource(sampleSource)
    const parsed = await likec4.parsedModel()

    expect(parsed.element('cloud').id).toBe('cloud')
    expect(parsed.element('cloud.frontend').kind).toBe('component')
    // Views are present in the parsed data (pre-compute) — visible via $data
    expect(Object.keys(parsed.$data.views)).toContain('index')
  })

  it('seeds Builder.fromParsed via toBuilder() and lets us enrich the model', async () => {
    const likec4 = await fromSource(sampleSource)
    // The returned builder is `Builder<AnyTypes>` because element kinds are only
    // known at runtime. Callers who know their spec statically can cast — here we
    // cast via `as any` to get access to builder methods for system/component.
    const builder = await likec4.toBuilder() as any

    const enriched = builder
      .model(({ system, component }: any, _: any) =>
        _(
          system('monitoring').with(
            component('grafana'),
            component('prometheus'),
          ),
        )
      )
      .views(({ view, $include }: any, _: any) =>
        _(
          view('monitoring', 'Monitoring').with(
            $include('monitoring.*'),
          ),
        )
      )
      .toLikeC4Model()

    // Seeded FQNs from the loaded DSL aren't in the static type set, but exist
    // at runtime — `findElement` returns nullable and works for both.
    expect(enriched.findElement('cloud' as never)?.id).toBe('cloud')
    expect(enriched.findElement('cloud.frontend' as never)?.id).toBe('cloud.frontend')
    expect(enriched.element('monitoring').id).toBe('monitoring')
    expect(enriched.element('monitoring.grafana').id).toBe('monitoring.grafana')
    expect(enriched.findView('index' as never)?.id).toBe('index')
    expect(enriched.view('monitoring').id).toBe('monitoring')
  })

  it('toBuilder() is editable by default — re-declaring a loaded element edits it', async () => {
    const likec4 = await fromSource(sampleSource)
    const builder = await likec4.toBuilder() as any

    const enriched = builder
      .model(({ component }: any, _: any) =>
        _(
          component('cloud.backend', { title: 'Patched backend' }),
        )
      )
      .toLikeC4Model()

    expect(enriched.element('cloud.backend').title).toBe('Patched backend')
  })

  it('toBuilder("strict") throws when re-declaring a loaded element', async () => {
    const likec4 = await fromSource(sampleSource)
    const builder = await likec4.toBuilder('strict') as any

    expect(() =>
      builder.model(({ component }: any, _: any) =>
        _(
          component('cloud.backend', { title: 'Patched backend' }),
        )
      )
    ).toThrow(/already exists/)
  })

  it('toTypedBuilder() returns a typed builder when the spec is a subset of the loaded model', async () => {
    const likec4 = await fromSource(sampleSource)
    const builder = await likec4.toTypedBuilder({
      specification: {
        elements: ['actor', 'system', 'component'],
      },
    })

    // `system` / `component` are statically known here — no `as any` needed.
    const enriched = builder
      .model(({ system, component }, _) =>
        _(
          system('monitoring').with(
            component('grafana'),
          ),
        )
      )
      .toLikeC4Model()

    expect(enriched.element('monitoring.grafana').id).toBe('monitoring.grafana')
  })

  it('toTypedBuilder() allows the loaded model to have extra kinds (subset semantics)', async () => {
    const likec4 = await fromSource(sampleSource)
    // Declare only `system` — the loaded model also has `actor` and `component`.
    await expect(likec4.toTypedBuilder({ specification: { elements: ['system'] } }))
      .resolves.toBeDefined()
  })

  it('toTypedBuilder() throws when declaring a kind absent from the loaded model', async () => {
    const likec4 = await fromSource(sampleSource)
    await expect(
      likec4.toTypedBuilder({
        specification: {
          elements: ['actor', 'system', 'component', 'database'],
        },
      }),
    ).rejects.toThrow(/element kind "database"/)
  })

  describe('relating new elements to existing ones (review comment 3)', () => {
    it('relates a new Builder element to an element loaded from the DSL', async () => {
      const likec4 = await fromSource(sampleSource)
      const updated = (await likec4.toBuilder())
        // loose builder → helpers are `any` (existing FQNs aren't in the type set)
        .model(({ system, relTo }: any, _: any) =>
          _(
            // `cloud.backend` is an existing element loaded from the DSL — it is
            // not in the static type set, but referencing it as a string works
            // and is validated against the seeded model at build time.
            system('monitoring').with(
              relTo('cloud.backend', 'observes'),
            ),
          )
        )
        .build()

      const rel = Object.values(updated.relations).find(r => (r as { title?: string }).title === 'observes')
      expect(rel, 'relation between new element and seeded element').toBeDefined()
      expect(rel?.source).toMatchObject({ model: 'monitoring' })
      expect(rel?.target).toMatchObject({ model: 'cloud.backend' })
    })

    it('rejects a relationship to a non-existing element', async () => {
      const likec4 = await fromSource(sampleSource)
      const builder = await likec4.toBuilder()
      expect(() =>
        builder.model(({ system, relTo }: any, _: any) =>
          _(
            system('monitoring').with(
              relTo('cloud.does-not-exist'),
            ),
          )
        )
      ).toThrow(/not found/)
    })
  })

  describe('finding and patching existing elements (review comment 2)', () => {
    it('walks existing elements via the computed model', async () => {
      const likec4 = await fromSource(sampleSource)
      const model = await likec4.computedModel()
      const ids = [...model.elements()].map(e => e.id)
      expect(ids).toEqual(
        expect.arrayContaining(['customer', 'cloud', 'cloud.backend', 'cloud.frontend']),
      )
    })

    it('editable mode REPLACES properties — unspecified props reset to defaults', async () => {
      const likec4 = await fromSource(sampleSource)
      const updated = (await likec4.toBuilder())
        .model(({ actor }: any, _: any) =>
          _(
            actor('customer', { metadata: { team: 'platform' } }),
          )
        )
        .build()

      // the metadata patch is applied...
      expect(updated.elements['customer']?.metadata).toEqual({ team: 'platform' })
      // ...but the original title `Customer` is gone — replaced by the FQN default.
      expect(updated.elements['customer']?.title).toBe('customer')
    })

    it('preserves other properties by reading the existing element and spreading its props', async () => {
      const likec4 = await fromSource(sampleSource)
      const existing = (await likec4.parsedModel()).element('customer')
      const updated = (await likec4.toBuilder())
        .model(({ actor }: any, _: any) =>
          _(
            actor('customer', {
              title: existing.title, // keep what you are not changing
              metadata: { team: 'platform' }, // add / patch
            }),
          )
        )
        .build()

      expect(updated.elements['customer']?.title).toBe('Customer')
      expect(updated.elements['customer']?.metadata).toEqual({ team: 'platform' })
    })
  })

  it('renders the parsed model back to DSL via toDSL()', async () => {
    const likec4 = await fromSource(sampleSource)
    const dsl = await likec4.toDSL()

    expect(dsl).toContain('specification')
    expect(dsl).toContain('actor')
    expect(dsl).toContain('component')
    expect(dsl).toContain('cloud')
    expect(dsl).toContain('customer')
  })

  it('round-trips: toDSL() output is parseable as a new workspace', async () => {
    const likec4 = await fromSource(sampleSource)
    const dsl = await likec4.toDSL()

    const reloaded = await fromSource(dsl, { throwIfInvalid: true })
    expect(reloaded.hasErrors()).toBe(false)

    const reloadedModel = await reloaded.computedModel()
    expect(reloadedModel.element('cloud.frontend').id).toBe('cloud.frontend')
    expect(reloadedModel.view('index').id).toBe('index')
  })

  describe('writeDSL', () => {
    beforeEach(() => {
      vol.reset()
    })

    it('writes the DSL to a file on disk', async () => {
      const tmpDir = '/tmp/likec4-writeDSL-test'
      vol.mkdirSync(tmpDir, { recursive: true })

      const likec4 = await fromSource(sampleSource)
      const written = await writeDSL(likec4, tmpDir)

      expect(written).toBe(join(tmpDir, 'model.c4'))
      const contents = vol.readFileSync(written, 'utf-8') as string
      expect(contents).toContain('specification')
      expect(contents).toContain('cloud')
    })

    it('honors a custom fileName', async () => {
      const tmpDir = '/tmp/likec4-writeDSL-custom'
      vol.mkdirSync(tmpDir, { recursive: true }) // dir already in fresh vol from beforeEach

      const likec4 = await fromSource(sampleSource)
      const written = await writeDSL(likec4, tmpDir, { fileName: 'snapshot.c4' })

      expect(written).toBe(join(tmpDir, 'snapshot.c4'))
    })
  })
})
