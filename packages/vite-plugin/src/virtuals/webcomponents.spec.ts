import type { ProjectId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'
import { generateWebcomponentsCode, projectWebcomponentsModule } from './webcomponents'

const jsStringLiteral = (value: string) => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(value))

describe('projectWebcomponentsModule', () => {
  it('is a project scoped module named webcomponents', () => {
    expect(projectWebcomponentsModule.name).toBe('webcomponents')
  })
})

describe('generateWebcomponentsCode', () => {
  it('defines a custom element backed by the project React module', () => {
    const code = generateWebcomponentsCode('project-a' as ProjectId)

    expect(code).toContain(`import { defineLikeC4Webcomponent } from 'likec4/react'`)
    expect(code).toContain(`import { LikeC4View } from ${jsStringLiteral('likec4:react/project-a')}`)
    expect(code).toContain('export function defineWebcomponent(name)')
    expect(code).toContain(`return defineLikeC4Webcomponent(name, LikeC4View, ${jsStringLiteral('project-a')})`)
  })

  it('hardens project ids embedded in generated JavaScript', () => {
    const projectId = 'project-a";\nthrow new Error("injected")//' as ProjectId
    const code = generateWebcomponentsCode(projectId)

    expect(code).toContain(`defineLikeC4Webcomponent(name, LikeC4View, ${jsStringLiteral(projectId)})`)
    expect(code).toContain(`from ${jsStringLiteral(`likec4:react/${projectId}`)}`)
    expect(code).not.toContain(`from 'likec4:react/${projectId}'`)
    expect(code).not.toContain(`LikeC4View, "${projectId}")`)
  })
})
