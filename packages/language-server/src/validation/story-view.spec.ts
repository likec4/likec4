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
    }
    stories {
      story other { scene v1 }
  `

  it('rejects a scene targeting a story', async ({ expect, validate }) => {
    // `other` is a story, not a view. Since stories moved into their own sibling
    // `stories { }` block (RFC 0002), a story is no longer exported under the `LikeC4View`
    // type at all, so `scene other` can no longer link — Langium's own reference-resolution
    // diagnostic is the rejection, rather than a custom "scene can not reference a story"
    // validation message (which would now be dead code, since it could never fire).
    const { errors } = await validate(`${preamble}
      story s { scene other }
    }`)
    expect(errors).toContain(`Could not resolve reference to LikeC4View named 'other'.`)
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

  it('rejects two stories sharing the same id', async ({ expect, validate }) => {
    const { errors } = await validate(`
      specification {
        element system
      }
      model {
        system a
      }
      views {
        view v1 { include a }
      }
      stories {
        story dup { scene v1 }
        story dup { scene v1 }
      }
    `)
    expect(errors.filter(m => m === `Duplicate story 'dup'`)).toHaveLength(2)
  })

  it('rejects anchor on the first scene of a story', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s { scene v1 { anchor a } }
    }`)
    expect(errors).toContain('The first scene in a story has no prior scene to anchor against')
  })

  it('accepts anchor on a scene that follows an earlier scene', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s {
        scene v1
        scene v1 { anchor a }
      }
    }`)
    expect(errors).toEqual([])
  })

  it('rejects anchor on a scene inside an alt branch when the alt is the story\'s first statement', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s {
        alt { when 'x' { scene v1 { anchor a } } else { scene v1 } }
      }
    }`)
    expect(errors).toContain('The first scene in a story has no prior scene to anchor against')
  })

  it('accepts anchor on a scene that is first inside an alt branch but has an earlier predecessor overall', async ({ expect, validate }) => {
    const { errors } = await validate(`${preamble}
      story s {
        scene v1
        alt { when 'x' { scene v1 { anchor a } } else { scene v1 } }
      }
    }`)
    expect(errors).toEqual([])
  })

  it('allows a view and a story to share the same id (separate namespaces, see RFC 0002 §5)', async ({ expect, validate }) => {
    const { errors } = await validate(`
      specification {
        element system
      }
      model {
        system a
      }
      views {
        view shared { include a }
      }
      stories {
        story shared { scene shared }
      }
    `)
    expect(errors).not.toContain(`Duplicate view 'shared'`)
    expect(errors).not.toContain(`Duplicate story 'shared'`)
    expect(errors).toEqual([])
  })
})
