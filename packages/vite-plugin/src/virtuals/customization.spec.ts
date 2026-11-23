import type { ProjectId } from '@likec4/core/types'
import { describe, expect, it, vi } from 'vitest'
import { customizationModule, generateCustomizationCode } from './customization'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'
import { generateProjectReactCode } from './react'

vi.mock('../logger', () => ({ logGenerating: vi.fn<() => void>() }))

describe('customizationModule', () => {
  it('exports empty overrides when the customization file is not configured', async () => {
    const result = await customizationModule.load.call({} as any, { customizationFile: undefined } as any)
    const code = typeof result === 'string' ? result : result.code

    expect(code).toContain('CustomizationContext')
    expect(code).not.toContain('import components from')
    expect(code).not.toContain('import.meta.hot')
  })

  it('imports the customization file and keeps overrides across HMR updates', async () => {
    const customizationFile = '/workspace/likec4.customization.tsx'
    const result = await customizationModule.load.call({} as any, { customizationFile } as any)
    const code = typeof result === 'string' ? result : result.code

    expect(code).toContain(
      `import components from ${hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(customizationFile))}`,
    )
    expect(code).toContain('export function CustomizationContext(')
    expect(code).toContain('import.meta.hot.accept(')
  })

  it('hardens the file path embedded in generated JavaScript', () => {
    const code = generateCustomizationCode('/workspace/</script><script>alert(1)//.tsx')

    expect(code).not.toContain('</script>')
  })
})

describe('generateProjectReactCode', () => {
  const projectId = 'project-a' as ProjectId

  it('does not touch customization when the file is not configured', () => {
    const code = generateProjectReactCode(projectId, false)

    expect(code).not.toContain('CustomizationContext')
    expect(code).not.toContain('likec4:customization')
    // LikeC4View renders LikeC4ModelProvider, so it must be a local binding, not only an export alias
    expect(code).toContain('export const LikeC4ModelProvider = ModelProvider')
  })

  it('applies overrides in the project provider when the file is configured', () => {
    const code = generateProjectReactCode(projectId, true)

    expect(code).toContain(`import { CustomizationContext } from 'likec4:customization'`)
  })
})
