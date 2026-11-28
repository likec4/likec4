import type { ViewId } from '@likec4/core'
import { describe } from 'vitest'
import { it } from './_it-spec'

describe('changeViewLayout', () => {
  it('replaces autoLayout with new value', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout LeftRight
      20 10
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 40,
          nodeSep: 30,
        },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
      "
      specification {
        element system
      }
      model {
        system = system 'System'
      }
      views {
        view target {
          include *
          autoLayout TopBottom 40 30
        }
      }"
    `)
  })

  it('inserts a layout inside a view with only non-layout rules', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 20,
        },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
      "
      specification {
        element system
      }
      model {
        system = system 'System'
      }
      views {
        view target {
          include *
          autoLayout TopBottom 20
        }
      }"
    `)
  })

  it('keeps compoundSep of the source when the change has none', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout LeftRight 20 10 80 ortho
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 40,
          nodeSep: 30,
        },
      },
    })

    expect(read()).toContain('autoLayout TopBottom 40 30 80 ortho')
  })

  it('writes compoundSep of the change and removes it when null', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout LeftRight 20 10 80
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'LR',
          rankSep: 20,
          nodeSep: 10,
          compoundSep: 150,
        },
      },
    })
    expect(read()).toContain('autoLayout LeftRight 20 10 150\n')

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'LR',
          rankSep: 20,
          nodeSep: 10,
          compoundSep: null,
        },
      },
    })
    expect(read()).toContain('autoLayout LeftRight 20 10\n')
  })

  it('keeps a 0 nodeSep and compoundSep on a direction change', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout TopBottom 120 0 150
  }
}`,
    )

    // the parsed view drops the 0 nodeSep, the diagram sends it back without it
    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'LR',
          rankSep: 120,
          compoundSep: 150,
        },
      },
    })
    expect(read()).toContain('autoLayout LeftRight 120 0 150\n')
  })

  it('keeps nodeSep and compoundSep of the source when the change has rankSep only', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout LeftRight 20 10 80
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 40,
        },
      },
    })
    expect(read()).toContain('autoLayout TopBottom 40 10 80\n')
  })

  it('writes 0 before compoundSep for a reset nodeSep', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  system = system 'System'
}
views {
  view target {
    include *
    autoLayout LeftRight 20 10 80
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-autolayout',
        layout: {
          direction: 'TB',
          rankSep: 40,
          nodeSep: null,
        },
      },
    })
    expect(read()).toContain('autoLayout TopBottom 40 0 80\n')
  })
})
