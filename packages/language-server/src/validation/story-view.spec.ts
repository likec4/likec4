import { describe, test } from 'vitest'
import { createTestServices } from '../test'

const it = test.extend<{
  $file: {
    t: ReturnType<typeof createTestServices>
  }
}>({
  t: [async ({}, use) => {
    const t = createTestServices()
    await use(t)
    t[Symbol.dispose]()
  }, { scope: 'file' }],
})
  .extend('validate', async ({ t }, { onCleanup }) => {
    onCleanup(() => t.resetState())
    return t.validate
  })

describe('story view validation', () => {
  const preamble = `
    specification {
      element system
    }
    model {
      system a
      system b
    }
    views {
      view v1 { include a }
      story other { scene v1 }
  `

  it('rejects a scene targeting a story', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s { scene other }
    }`)
    expect(errors).toContain('A scene can not reference a story view')
  })

  it('rejects an empty alt', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s {
        scene v1
        alt { }
      }
    }`)
    expect(errors).toContain('Alt must have at least one branch')
  })

  it('rejects block kinds that are not yet supported', async ({ expect, validate }) => {
    for (const kind of ['opt', 'loop', 'par', 'break']) {
      const { errors } = await validate(`${preamble}
        story s {
          ${kind} { scene v1 }
        }
      }`)
      expect(errors).toContain(`"${kind}" is not yet supported in stories`)
    }
  })

  it('rejects a non-branch block directly inside alt', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s {
        alt {
          opt { scene v1 }
        }
      }
    }`)
    expect(errors).toContain(
      '"opt" can not be used as an alternative branch, only "if", "when" or "else" are allowed',
    )
  })

  it('rejects an alt branch outside alt', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s {
        when 'x' { scene v1 }
      }
    }`)
    expect(errors).toContain('"when" alternative branch must be inside "alt"')
  })

  it('warns when a story has no scenes', async ({ expect, validate }) => {
    const { warnings } = await validate(`${preamble}
      story s { }
    }`)
    expect(warnings).toContain('Story has no scenes')
  })

  it('accepts a valid story', async ({ expect, validate }) => {
    const { errors, warnings } = await validate(`${preamble}
      story s {
        scene v1
        alt { when 'x' { scene v1 } else { scene v1 } }
      }
    }`)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })
})
