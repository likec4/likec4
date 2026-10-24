import { DiffId } from '@likec4/core/types'
import { describe, it } from 'vitest'
import { fromSource } from '../node/index'

describe('LikeC4.modelEdits', () => {
  it('apply — when the workspace has no file system then returns a failed result', async ({ expect }) => {
    const likec4 = await fromSource(`
      specification {
        element system
      }
      model {
        app = system 'App'
      }
      diff rfc1 {
        add {
          api = system 'API'
        }
      }
    `)

    const result = await likec4.modelEdits.apply({ type: 'apply-diff', diffId: DiffId('rfc1'), action: 'apply' })
    expect(result).toEqual({
      applied: false,
      remaining: [],
      error: 'The edit was not applied: No file system is available.',
    })
  })
})
