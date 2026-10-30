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
})
