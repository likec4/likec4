import { fromSources } from '@likec4/language-services/node'
import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

const model = `
  specification {
    element component
  }
  model {
    a = component 'A'
    b = component 'B'
    c = component 'C'
    a -> b 'uses'
    b -> c 'calls'
  }
`

describe('view routing', () => {
  it('resolves routing ortho from the view property and omits it for spline', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      ${model}
      views {
        view ortho {
          routing ortho
          include *
        }
        view curved {
          routing: spline
          include *
        }
        view untouched {
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('ortho').$view.routing).toBe('ortho')
    expect(m.view('curved').$view).not.toHaveProperty('routing')
    expect(m.view('untouched').$view).not.toHaveProperty('routing')
  })

  it('accepts routing as autoLayout sugar, property wins over sugar', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      ${model}
      views {
        view sugar {
          include *
          autoLayout TopBottom ortho
        }
        view sugarWithSpacing {
          include *
          autoLayout LeftRight 120 110 ortho
        }
        view propertyWins {
          routing spline
          include *
          autoLayout TopBottom ortho
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('sugar').$view.routing).toBe('ortho')
    expect(m.view('sugarWithSpacing').$view).toMatchObject({
      routing: 'ortho',
      autoLayout: { direction: 'LR', rankSep: 120, nodeSep: 110 },
    })
    expect(m.view('propertyWins').$view).not.toHaveProperty('routing')
  })

  it('applies the project default from likec4.config and lets a view override it', async ({ expect }) => {
    const likec4 = await fromSources({
      'likec4.config.json': JSON.stringify({
        name: 'routing-test',
        styles: { defaults: { view: { routing: 'ortho' } } },
      }),
      'model.c4': `
        ${model}
        views {
          view byDefault {
            include *
          }
          view overridden {
            routing spline
            include *
          }
        }
      `,
    })
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('byDefault').$view.routing).toBe('ortho')
    expect(m.view('overridden').$view).not.toHaveProperty('routing')
  })

  it('changes the view layout hash when routing flips, but not for an explicit spline', async ({ expect }) => {
    const hashOf = async (viewBody: string) => {
      const likec4 = await LikeC4.fromSource(`
        ${model}
        views {
          view index {
            ${viewBody}
            include *
          }
        }
      `)
      expect(likec4.hasErrors()).toBe(false)
      const m = await likec4.computedModel()
      return m.view('index').$view.hash
    }
    const plain = await hashOf('')
    const spline = await hashOf('routing spline')
    const ortho = await hashOf('routing ortho')
    expect(spline).toEqual(plain)
    expect(ortho).not.toEqual(plain)
  })

  it('applies to dynamic and deployment views', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      specification {
        element component
        deploymentNode node
      }
      model {
        a = component 'A'
        b = component 'B'
        a -> b 'uses'
      }
      deployment {
        node prod {
          instanceOf a
          instanceOf b
        }
      }
      views {
        dynamic view flow {
          routing ortho
          a -> b 'calls'
        }
        dynamic view flowSugar {
          a -> b 'calls'
          autoLayout LeftRight ortho
        }
        deployment view deployed {
          routing: ortho
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('flow').$view.routing).toBe('ortho')
    expect(m.view('flowSugar').$view.routing).toBe('ortho')
    expect(m.view('deployed').$view.routing).toBe('ortho')
  })
})
