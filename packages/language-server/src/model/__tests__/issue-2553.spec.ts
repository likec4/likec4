import { afterEach, describe, it, vi } from 'vitest'
import { createTestServices } from '../../test'

// https://github.com/likec4/likec4/issues/2553
// `layoutedModel()` used `layoutAllViews()`, which returns fresh auto-layouts and ignores
// manual layouts — so `codegen react` (and other `layoutedModel()` consumers) produced
// views without manual layouts. The fix routes view resolution through `diagrams()`, which
// merges manual layouts via `withLayoutType(..., 'manual')`.
//
// This is a call-path regression guard: it asserts `layoutedModel()` goes through the
// manual-layout-aware `diagrams()` path. A full behavioral test would need to wire up the
// `ManualLayouts` service with a snapshot, for which the suite has no existing harness.
describe('Issue 2553 - layoutedModel routes through diagrams()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const source = `
    specification {
      element system
    }
    model {
      a = system 'A'
      b = system 'B'
      a -> b
    }
    views {
      view index {
        include *
      }
    }
  `

  it('layoutedModel() resolves views via diagrams() (the manual-layout-aware path)', async ({ expect }) => {
    const { services, validate } = createTestServices()
    await validate(source)

    const diagramsSpy = vi.spyOn(services.likec4.Views, 'diagrams')

    const model = await services.likec4.LanguageServices.layoutedModel()

    // The layouted views are still produced correctly
    expect(model.view('index')).toBeDefined()

    // If `layoutedModel()` regresses to `layoutAllViews()`, `diagrams()` is no longer called
    // and manual layouts stop being applied.
    expect(diagramsSpy).toHaveBeenCalled()
  })
})
