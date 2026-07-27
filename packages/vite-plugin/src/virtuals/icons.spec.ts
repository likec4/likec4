import { describe, expect, it } from 'vitest'
import { generateIconRendererCode } from './icons'

describe('generateIconRendererCode', () => {
  it('includes model-level icons not present in any computed view', () => {
    const code = generateIconRendererCode({
      views: {},
      elements: {
        component: {
          style: {
            icon: 'file:///workspace/icons/component.svg',
          },
        },
      },
      deployments: {
        elements: {},
      },
    })

    expect(code).toContain('import Icon00 from \'file:///workspace/icons/component.svg?raw\'')
    expect(code).toContain('\'file:///workspace/icons/component.svg\': props => jsx(InlineSvgIcon')
  })

  it('keeps local bitmap icons as image assets', () => {
    const code = generateIconRendererCode({
      views: {
        index: {
          nodes: [{
            icon: 'file:///workspace/icons/component.png',
          }],
        },
      },
      elements: {},
      deployments: {
        elements: {},
      },
    })

    expect(code).toContain('import Icon00 from \'file:///workspace/icons/component.png?inline\'')
    expect(code).toContain('\'file:///workspace/icons/component.png\': props => jsx(\'img\'')
  })

  it('includes deployment element icons', () => {
    const code = generateIconRendererCode({
      views: {},
      elements: {},
      deployments: {
        elements: {
          node: {
            style: {
              icon: 'file:///workspace/icons/node.svg',
            },
          },
        },
      },
    })

    expect(code).toContain('import Icon00 from \'file:///workspace/icons/node.svg?raw\'')
  })
})
