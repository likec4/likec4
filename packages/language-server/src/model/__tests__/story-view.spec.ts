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
