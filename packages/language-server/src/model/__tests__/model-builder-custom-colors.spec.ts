import type { ViewId } from '@likec4/core'
import { ThemeColors } from '@likec4/core/styles'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder - Custom Colors', () => {
  it('parses custom color definitions', async ({ expect }) => {
    const { validate, buildModel, buildLikeC4Model } = createTestServices()
    const { errors, warnings } = await validate(`
      specification {
        color custom-color1 #db83db
        color custom-color2 #FFFF00

        element component {
          style {
            color custom-color2
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])

    const modelData = await buildModel()
    expect(modelData.specification).toHaveProperty('customColors', {
      'custom-color1': {
        elements: {
          fill: '#db83db',
          hiContrast: '#000000',
          loContrast: '#000000',
          stroke: '#b25db3',
        },
        relationships: {
          label: '#000000',
          labelBg: '#db83db',
          line: '#a462a4',
        },
      },
      'custom-color2': {
        elements: {
          fill: '#FFFF00',
          hiContrast: '#4d5c00',
          loContrast: '#606e00',
          stroke: '#d2d600',
        },
        relationships: {
          labelBg: '#FFFF00',
          label: '#4d5c00',
          line: '#bfbf00',
        },
      },
    })
  })
  it('custom colors are available in the styles', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { errors, warnings } = await validate(`
      specification {
        color custom-color1 #FF00FF
        color custom-color2 #FFFF00

        element component {
          style {
            color custom-color2
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])

    const likeC4ModelData = await buildLikeC4Model()

    expect(likeC4ModelData.$styles.theme.colors).to.have.same.keys([
      'custom-color1',
      'custom-color2',
      ...ThemeColors,
    ])

    // Check that custom colors are available in the styles
    expect(likeC4ModelData.$styles.theme.colors).toHaveProperty(
      'custom-color1',
      {
        elements: {
          fill: expect.any(String),
          hiContrast: expect.any(String),
          loContrast: expect.any(String),
          stroke: expect.any(String),
        },
        relationships: {
          labelBg: expect.any(String),
          label: expect.any(String),
          line: expect.any(String),
        },
      },
    )
    expect(likeC4ModelData.$styles.theme.colors).toHaveProperty('custom-color2')
  })

  it('allows custom colors in spec', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { errors, warnings } = await validate(`
      specification {
        element component {
          style {
            color custom-color1
          }
        }

        relationship uses {
          color custom-color1
        }

        color custom-color1 #FF00FF
      }
      model {
        component sys1
        component sys2
        sys1 -[uses]-> sys2
      }
      views {
        view {
          include *
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.edges[0]?.color).toBe('custom-color1')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('custom-color1')
    expect(indexView.nodes.find(n => n.id === 'sys2')?.color).toBe('custom-color1')
  })

  it('allows custom colors in relationships', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { errors, warnings } = await validate(`
      specification {
        element component

        color custom-color1 #FF00FF
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2 {
          style {
            color custom-color1
          }
        }
      }
      views {
        view {
          include *
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.edges[0]?.color).toBe('custom-color1')
  })

  it('allows custom colors in include expressions of view', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { errors, warnings } = await validate(`
      specification {
        element component

        color custom-color1 #FF00FF
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1 with {
            color custom-color1
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('custom-color1')
  })
})
