import { invariant } from '@likec4/core'
import { describe } from 'vitest'
import { testFileScope as it } from '../../test'

describe('story view grammar', () => {
  it('parses a story with scenes, alt and becomes', async ({ expect, validate }) => {
    const { errors, warnings } = await validate(`
      specification {
        element system
      }
      model {
        system mono
        system orders
        system billing
      }
      views {
        view before { include mono }
        view after { include orders, billing }
      }
      stories {
        story migration {
          title 'Migration'

          scene before {
            notes 'One deployable'
          }
          scene after {
            title 'Split out'
            mono becomes orders, billing
          }
          alt 'Two ways' {
            when 'fast' { scene after }
            else { scene before }
          }
        }
      }
    `)
    // `alt` is now rejected unconditionally (see `storyAltChecks` in
    // `packages/language-server/src/validation/story-view.ts`), regardless of whether its
    // branches are otherwise well-formed.
    expect(errors).toEqual(['"alt" is not yet supported in stories'])
    // `before` and `after` are each referenced once as a top-level scene and again from the
    // `alt` branches — a legitimate depth-first-`alt` pattern (RFC 0001), but one this feature's
    // validation now warns about since scene identity is currently keyed by view id, not by
    // occurrence. See docs/superpowers/plans/2026-08-04-story-scene-anchor.md.
    expect(warnings).toHaveLength(2)
    expect(warnings).toContain(
      'Scene \'before\' appears more than once in this story\'s traversal order. Scene stepping, boundary detection, and anchors cannot currently distinguish between the occurrences — see docs/superpowers/plans/2026-08-04-story-scene-anchor.md.',
    )
    expect(warnings).toContain(
      'Scene \'after\' appears more than once in this story\'s traversal order. Scene stepping, boundary detection, and anchors cannot currently distinguish between the occurrences — see docs/superpowers/plans/2026-08-04-story-scene-anchor.md.',
    )
  })

  it('still allows story, scene and becomes as element names', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
      specification {
        element system
      }
      model {
        system story
        system scene
        system becomes
        system anchor
      }
    `)
    expect(diagnostics).toHaveLength(0)
  })
})

describe('ParsedAstStoryView', () => {
  it('parses a story into ParsedAstStoryView', async ({ expect, t, validate }) => {
    const { document } = await validate(`
      specification {
        element system
      }
      model {
        system mono
        system orders
        system billing
      }
      views {
        view before { include mono }
        view after { include orders, billing }
      }
      stories {
        story migration {
          title 'Migration'
          scene before { notes 'One deployable' }
          scene after {
            anchor orders
            mono becomes orders, billing
          }
        }
      }
    `)
    const { c4Stories } = t.likec4.ModelParser.parse(document)
    const story = c4Stories.find(v => v.id === 'migration')
    expect(story).toMatchObject({
      id: 'migration',
      title: 'Migration',
    })
    invariant(story, 'Expected story view')
    expect(story.statements).toHaveLength(2)
    // `notes` is `scalar.MarkdownOrString`, not a flat string.
    expect(story.statements[0]).toMatchObject({ view: 'before', notes: { txt: 'One deployable' } })
    // `before` has no `anchor` statement, so its `anchor` field is left undefined — a plain
    // crossfade, per the design.
    expect((story.statements[0] as { anchor?: unknown }).anchor).toBeUndefined()
    expect(story.statements[1]).toMatchObject({
      view: 'after',
      anchor: 'orders',
      becomes: [{ sources: ['mono'], targets: ['orders', 'billing'] }],
    })
  })

  it('resolves a scene that forward-references a view declared later in the document', async ({ expect, t, validate }) => {
    const { document } = await validate(`
      specification {
        element system
      }
      model {
        system mono
      }
      views {
        view laterView { include mono }
      }
      stories {
        story migration {
          scene laterView
        }
      }
    `)
    const { c4Stories } = t.likec4.ModelParser.parse(document)
    const story = c4Stories.find(v => v.id === 'migration')
    invariant(story, 'Expected story view')
    // Regression test: the scene must resolve, not be silently dropped, regardless of whether
    // `laterView` is declared before or after `migration` in the same `views { }` block.
    expect(story.statements).toHaveLength(1)
    expect(story.statements[0]).toMatchObject({ view: 'laterView' })
  })
})
