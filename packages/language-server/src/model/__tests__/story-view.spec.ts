import { invariant } from '@likec4/core'
import { describe } from 'vitest'
import { testFileScope as it } from '../../test'

describe('story view grammar', () => {
  it('parses a story with scenes, alt and becomes', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
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
          sceneLayout anchored

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
    expect(diagnostics).toHaveLength(0)
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
        system sceneLayout
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
          sceneLayout independent
          scene before { notes 'One deployable' }
          scene after { mono becomes orders, billing }
        }
      }
    `)
    const { c4Stories } = t.likec4.ModelParser.parse(document)
    const story = c4Stories.find(v => v.id === 'migration')
    expect(story).toMatchObject({
      id: 'migration',
      title: 'Migration',
      sceneLayout: 'independent',
    })
    invariant(story, 'Expected story view')
    expect(story.statements).toHaveLength(2)
    // `notes` is `scalar.MarkdownOrString`, not a flat string.
    expect(story.statements[0]).toMatchObject({ view: 'before', notes: { txt: 'One deployable' } })
    expect(story.statements[1]).toMatchObject({
      view: 'after',
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
