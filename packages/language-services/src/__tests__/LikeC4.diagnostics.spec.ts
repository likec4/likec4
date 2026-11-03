import { describe, it } from 'vitest'
import { fromSource } from '../node/index'

describe('LikeC4 diagnostics', () => {
  it('getWarnings — returns warnings, which are not errors', async ({ expect }) => {
    await using likec4 = await fromSource(
      `
      specification {
        element component
      }
      model {
        component a {
          style {
            opacity 150%
          }
        }
      }
    `,
      { printErrors: false },
    )

    expect(likec4.hasErrors()).toBe(false)
    expect(likec4.getErrors()).toEqual([])
    expect(likec4.getWarnings()).toEqual([
      expect.objectContaining({
        message: 'Value ignored, must be between 0% and 100%',
        line: 7,
        range: expect.objectContaining({ start: { line: 7, character: 20 } }),
      }),
    ])
  })

  it('getErrors — does not include warnings', async ({ expect }) => {
    await using likec4 = await fromSource(
      `
      specification {
        element component
      }
      model {
        component a {
          style {
            opacity 150%
          }
        }
        a -> unknown
      }
    `,
      { printErrors: false },
    )

    expect(likec4.getErrors().length).toBeGreaterThan(0)
    expect(likec4.getErrors().map(e => e.message)).not.toContain('Value ignored, must be between 0% and 100%')
    expect(likec4.getWarnings()).toHaveLength(1)
  })
})
