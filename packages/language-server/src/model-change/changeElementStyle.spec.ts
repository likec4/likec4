import type { Fqn, ViewId } from '@likec4/core'
import { describe, vi } from 'vitest'
import { it } from './_it-spec'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('changeElementStyle', () => {
  it('inserts a style inside a view with only non-style rules', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    include *
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    include *
    style user {
      shape person
    }
  }
}"`)
  })

  it('updates an existing style for the same element', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style user {
      shape person
    }
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'mobile' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style user {
      shape mobile
    }
  }
}"`)
  })

  it('inserts a style while preserving an existing style for another element', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style app {
      shape rectangle
    }
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style app {
      shape rectangle
    }
    style user {
      shape person
    }
  }
}"`)
  })

  it('inserts a style inside a dynamic view with no rules', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  dynamic view target {
    user -> app
    style user {
      shape person
    }
  }
}"`)
  })

  it('inserts a style inside an empty view that extends another view', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  view base {
    include *
  }
  view target extends base {}
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['user' as Fqn],
        style: { shape: 'person' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
}
model {
  user = system 'User'
  app = system 'Application'
}
views {
  view base {
    include *
  }
  view target extends base {
    style user {
      shape person
    }
  }
}"`)
  })

  it('inserts a style inside a deployment view with only non-style rules', async ({ expect, testDoc }) => {
    const { change, read } = await testDoc(
      `
specification {
  element system
  deploymentNode node
}
model {
  app = system 'Application'
}
deployment {
  node prod 'Production' {
    instanceOf app
  }
}
views {
  deployment view target {
    include prod.**
  }
}`,
    )

    await change({
      viewId: 'target' as ViewId,
      change: {
        op: 'change-element-style',
        targets: ['prod' as Fqn],
        style: { shape: 'browser' },
      },
    })

    expect(read()).toMatchInlineSnapshot(`
"
specification {
  element system
  deploymentNode node
}
model {
  app = system 'Application'
}
deployment {
  node prod 'Production' {
    instanceOf app
  }
}
views {
  deployment view target {
    include prod.**
    style prod {
      shape browser
    }
  }
}"`)
  })
})
