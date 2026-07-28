import type { ProjectId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'
import { generateWebcomponentsCode, projectWebcomponentsModule } from './webcomponents'

const jsStringLiteral = (value: string) => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(value))

describe('projectWebcomponentsModule', () => {
  it('matches project-scoped webcomponent module ids', () => {
    expect(projectWebcomponentsModule.matches('likec4:webcomponents/project-a')).toBe('project-a')
    expect(projectWebcomponentsModule.matches('likec4:plugin/project-a/webcomponents.js')).toBe('project-a')
    expect(projectWebcomponentsModule.matches('likec4:webcomponents')).toBeNull()
    expect(projectWebcomponentsModule.virtualId('project-a' as ProjectId)).toBe(
      'likec4:plugin/project-a/webcomponents.js',
    )
  })
})

describe('generateWebcomponentsCode', () => {
  it('generates a custom element backed by the project React module', () => {
    const code = generateWebcomponentsCode('project-a' as ProjectId)

    expect(code).toContain(`import { LikeC4View } from ${jsStringLiteral('likec4:react/project-a')}`)
    expect(code).toContain('export function defineWebcomponent(name)')
    expect(code).toContain(
      `static observedAttributes = ['view-id', 'browser', 'dynamic-variant', 'color-scheme']`,
    )
    expect(code).toContain(`viewId: element.getAttribute('view-id') ?? 'index'`)
    expect(code).toContain(`customElements.define(name, LikeC4ViewElement)`)
  })

  it('hardens project ids embedded in generated JavaScript', () => {
    const projectId = 'project-a";\nthrow new Error("injected")//' as ProjectId
    const code = generateWebcomponentsCode(projectId)

    expect(code).toContain(`const projectId = ${jsStringLiteral(projectId)}`)
    expect(code).toContain(`from ${jsStringLiteral(`likec4:react/${projectId}`)}`)
    expect(code).not.toContain(`from 'likec4:react/${projectId}'`)
  })
})
