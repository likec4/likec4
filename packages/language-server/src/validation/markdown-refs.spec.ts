import type { LangiumDocument } from 'langium'
import { describe } from 'vitest'
import type { Diagnostic } from 'vscode-languageserver-types'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { createMultiProjectTestServices, testFileScope as it } from '../test'

const spec = `
  specification {
    element component
  }
`

const elements = `
    component cloud {
      component backend {
        component api
      }
    }
`

const views = `
  views {
    view index {
      include *
    }
  }
`

/**
 * Diagnostic with the document text at its range
 */
function summary(document: LangiumDocument, diagnostics: Diagnostic[]) {
  const text = document.textDocument.getText()
  return diagnostics.map(d => ({
    severity: d.severity,
    message: d.message,
    text: document.textDocument.getText(d.range),
    // offset of the range start, to check the exact location
    offset: document.textDocument.offsetAt(d.range.start),
    line: text.split('\n')[d.range.start.line]!.trim(),
  }))
}

describe('markdownRefsChecks', () => {
  it('accepts existing elements, nested elements and views', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
      ${spec}
      model {
        ${elements}
        component docs {
          description '''
            Calls [[cloud]], [[cloud.backend.api]] and [[cloud.backend|Backend]].
            See [[view:index]].
          '''
          summary """[[cloud.backend.api|API]]"""
        }
      }
      ${views}
    `)
    expect(diagnostics).toEqual([])
  })

  it('warns about missing element', async ({ expect, validate }) => {
    const { document, diagnostics } = await validate(`
      ${spec}
      model {
        ${elements}
        component docs {
          description '''
            Calls [[cloud.backend.missing|Missing]] and [[api]]
          '''
        }
      }
      ${views}
    `)
    const text = document.textDocument.getText()
    expect(summary(document, diagnostics)).toEqual([
      {
        severity: DiagnosticSeverity.Warning,
        message: `Element 'cloud.backend.missing' not found`,
        text: 'cloud.backend.missing',
        offset: text.indexOf('[[cloud.backend.missing') + 2,
        line: 'Calls [[cloud.backend.missing|Missing]] and [[api]]',
      },
      {
        // FQN is absolute
        severity: DiagnosticSeverity.Warning,
        message: `Element 'api' not found`,
        text: 'api',
        offset: text.indexOf('[[api]]') + 2,
        line: 'Calls [[cloud.backend.missing|Missing]] and [[api]]',
      },
    ])
  })

  it('warns about missing view', async ({ expect, validate }) => {
    const { document, diagnostics } = await validate(`
      ${spec}
      model {
        ${elements}
        component docs {
          description """See [[view:index]] and [[view:missing|Missing]]"""
        }
      }
      ${views}
    `)
    const text = document.textDocument.getText()
    expect(summary(document, diagnostics)).toEqual([
      {
        severity: DiagnosticSeverity.Warning,
        message: `View 'missing' not found`,
        text: 'missing',
        offset: text.indexOf('[[view:missing') + 7,
        line: 'description """See [[view:index]] and [[view:missing|Missing]]"""',
      },
    ])
  })

  it('warns about unknown namespace on the namespace', async ({ expect, validate }) => {
    const { document, diagnostics } = await validate(`
      ${spec}
      model {
        ${elements}
        component docs {
          description '''
            [[deployment:prod.api]]
          '''
        }
      }
      ${views}
    `)
    const text = document.textDocument.getText()
    expect(summary(document, diagnostics)).toEqual([
      {
        severity: DiagnosticSeverity.Warning,
        message: `Unknown link namespace 'deployment'`,
        text: 'deployment',
        offset: text.indexOf('[[deployment') + 2,
        line: '[[deployment:prod.api]]',
      },
    ])
  })

  it('ignores refs in code and plain strings', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
      ${spec}
      model {
        ${elements}
        component docs {
          title 'Plain [[missing1]]'
          technology "Plain [[missing2]]"
          description '''
            Inline \`[[missing3]]\` and escaped \\\\[[missing4]]

            \`\`\`
            [[missing5]]
            \`\`\`
          '''
        }
      }
      ${views}
    `)
    expect(diagnostics).toEqual([])
  })

  it('checks refs in relations, views and metadata', async ({ expect, validate }) => {
    const { warnings, errors } = await validate(`
      ${spec}
      model {
        ${elements}
        cloud -> docs {
          title '''[[missing1]]'''
          description '''[[missing2]]'''
        }
        component docs {
          metadata {
            ref '''[[missing3]]'''
            refs ['''[[missing4]]''', 'plain [[missing]]']
          }
        }
      }
      views {
        view index {
          include *
        }
        view other {
          description '''[[view:missing5]]'''
          include *
        }
      }
    `)
    expect(errors).toEqual([])
    expect(warnings).toEqual([
      `Element 'missing1' not found`,
      `Element 'missing2' not found`,
      `Element 'missing3' not found`,
      `Element 'missing4' not found`,
      `View 'missing5' not found`,
    ])
  })

  it('resolves refs within the project of the document', async ({ expect }) => {
    await using services = await createMultiProjectTestServices({
      project1: {
        model: `
          specification {
            element component
          }
          model {
            component a {
              component b
            }
          }
          views {
            view v1 {}
          }
        `,
        docs: `
          model {
            component docs {
              description '''[[a.b]] [[view:v1]] [[c]] [[view:v2]]'''
            }
          }
        `,
      },
      project2: {
        model: `
          specification {
            element component
          }
          model {
            component c
          }
          views {
            view v2 {}
          }
        `,
        docs: `
          model {
            component docs {
              description '''[[a.b]] [[view:v1]] [[c]] [[view:v2]]'''
            }
          }
        `,
      },
    })
    await services.validateAll()
    const warningsOf = (doc: LangiumDocument) => (doc.diagnostics ?? []).map(d => d.message)
    expect(warningsOf(services.projects.project1.docs)).toEqual([
      `Element 'c' not found`,
      `View 'v2' not found`,
    ])
    expect(warningsOf(services.projects.project2.docs)).toEqual([
      `Element 'a.b' not found`,
      `View 'v1' not found`,
    ])
  })
})
