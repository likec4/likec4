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

  it('includes supported bundled icon groups', () => {
    const code = generateIconRendererCode({
      views: {
        index: {
          nodes: [{
            icon: 'bootstrap:file-earmark-code',
          }],
        },
      },
      elements: {
        component: {
          style: {
            icon: 'tech:react',
          },
        },
      },
      deployments: {
        elements: {},
      },
    })

    expect(code).toContain(
      `import Icon00 from ${jsStringLiteral('likec4:icon-bundle/bootstrap/file-earmark-code.jsx')}`,
    )
    expect(code).toContain(`import Icon01 from ${jsStringLiteral('likec4:icon-bundle/tech/react.jsx')}`)
    expect(code).toContain(`${jsStringLiteral('bootstrap:file-earmark-code')}: Icon00`)
    expect(code).toContain(`${jsStringLiteral('tech:react')}: Icon01`)
  })

  it('ignores unsupported non-local icon references instead of emitting invalid bundle imports', () => {
    const code = generateIconRendererCode({
      views: {
        index: {
          nodes: [
            {
              icon: 'none',
            },
            {
              icon: 'data:image/svg+xml,<svg />',
            },
            {
              icon: 'mdi:server',
            },
          ],
        },
      },
      elements: {},
      deployments: {
        elements: {},
      },
    })

    expect(code).not.toContain('likec4:icon-bundle/none/')
    expect(code).not.toContain('likec4:icon-bundle/data/')
    expect(code).not.toContain('likec4:icon-bundle/mdi/')
    expect(code).not.toContain(`${jsStringLiteral('none')}:`)
    expect(code).not.toContain(`${jsStringLiteral('data:image/svg+xml,<svg />')}:`)
    expect(code).not.toContain(`${jsStringLiteral('mdi:server')}:`)
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

  it('escapes supported bundled icon references before embedding them into generated code', () => {
    const icon = 'tech:react\';\nthrow new Error("pwned")//'
    const code = generateIconRendererCode({
      views: {
        index: {
          nodes: [{
            icon,
          }],
        },
      },
      elements: {},
      deployments: {
        elements: {},
      },
    })

    expect(code).toContain(
      `import Icon00 from ${jsStringLiteral('likec4:icon-bundle/tech/react\';\nthrow new Error("pwned")//.jsx')}`,
    )
    expect(code).toContain(`${jsStringLiteral(icon)}: Icon00`)
    expect(code).not.toContain(`from 'likec4:icon-bundle/tech/react';`)
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
    expect(code).toContain('/currentcolor/i.test(raw)')
    expect(code).toContain('backgroundColor: \'currentColor\'')
    expect(code).not.toContain('dangerouslySetInnerHTML')
  })
})
