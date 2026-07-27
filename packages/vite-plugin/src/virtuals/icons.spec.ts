import { describe, expect, it } from 'vitest'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'
import { generateIconRendererCode } from './icons'

const jsStringLiteral = (value: string) => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(value))

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

    expect(code).toContain(`import Icon00Raw from ${jsStringLiteral('file:///workspace/icons/component.svg?raw')}`)
    expect(code).toContain(`import Icon00 from ${jsStringLiteral('file:///workspace/icons/component.svg?inline')}`)
    expect(code).toContain(`${jsStringLiteral('file:///workspace/icons/component.svg')}: props => jsx(LocalSvgIcon`)
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

    expect(code).toContain(`import Icon00 from ${jsStringLiteral('file:///workspace/icons/component.png?inline')}`)
    expect(code).toContain(`${jsStringLiteral('file:///workspace/icons/component.png')}: props => jsx('img'`)
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

    expect(code).toContain(`import Icon00Raw from ${jsStringLiteral('file:///workspace/icons/node.svg?raw')}`)
    expect(code).toContain(`import Icon00 from ${jsStringLiteral('file:///workspace/icons/node.svg?inline')}`)
  })

  it('escapes icon references before embedding them into generated code', () => {
    const icon = 'file:///workspace/icons/icon\';\nthrow new Error("pwned")//.svg'
    const code = generateIconRendererCode({
      views: {},
      elements: {
        component: {
          style: {
            icon,
          },
        },
      },
      deployments: {
        elements: {},
      },
    })

    expect(code).toContain(`import Icon00Raw from ${jsStringLiteral(`${icon}?raw`)}`)
    expect(code).toContain(`import Icon00 from ${jsStringLiteral(`${icon}?inline`)}`)
    expect(code).toContain(`${jsStringLiteral(icon)}: props => jsx(LocalSvgIcon`)
    expect(code).not.toContain(`from '${icon}?raw'`)
    expect(code).not.toContain(`from '${icon}?inline'`)
  })

  it('renders currentColor local SVG assets as masks without injecting raw SVG markup', () => {
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

    expect(code).toContain('function MaskedSvgIcon')
    expect(code).toContain('function LocalSvgIcon')
    expect(code).toContain('raw.includes(\'currentColor\')')
    expect(code).toContain('backgroundColor: \'currentColor\'')
    expect(code).not.toContain('dangerouslySetInnerHTML')
  })
})
