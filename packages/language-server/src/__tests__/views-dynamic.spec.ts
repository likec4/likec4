import { type TestContext, describe, it } from 'vitest'
import { createTestServices } from '../test'

const model = `
  specification {
    element component
    tag epic-123
    tag next
    color custom-color #ff0000
  }
  model {
    component user
    component system {
      component backend {
        component model
        component api {
          #next
        }
      }
      component auth {
        component api
      }
      component frontend
    }
    component infra {
      component database
    }

    backend.model -> infra.database
    backend.api -> backend.model
    auth.api -> backend.api
    frontend -> auth.api
    frontend -> backend.api
    user -> frontend
  }
`

async function mkTestServices({ expect }: TestContext) {
  expect.hasAssertions()
  const { validate } = createTestServices()
  await validate(model, 'model.c4')

  const validateView = (view: string) =>
    validate(`
      views {
        ${view}
      }
    `)

  return {
    valid: async (view: string) => {
      const { errors, warnings } = await validateView(view)
      expect(errors.concat(warnings).join('\n')).toEqual('')
    },
    invalid: async (view: string) => {
      const { errors } = await validateView(view)
      expect(errors).not.toEqual([])
    },
  }
}

describe('dynamic views', () => {
  it('valid dynamic view', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        title 'System Context'

        user -> system.frontend 'User uses System'
        system.frontend -> system.backend 'frontend uses backend'
        system.frontend <- system.backend

        style * {
          color custom-color
        }
        autoLayout BottomTop
      }
    `)
  })

  it('valid dynamic view with custom step', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        title 'System Context'

        user -> system.frontend 'User uses System' {
          description 'some description'
          color red
        }
        system.frontend -> system.backend 'frontend uses backend'
        system.frontend <- system.backend

        style * {
          color red
          multiple true
        }
        autoLayout BottomTop
      }
    `)
  })

  it('valid dynamic view with step and notation', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        title 'System Context'

        user -> system.frontend 'User uses System' {
          description 'some description'
          color red
          notation 'some notation'
        }
        system.frontend -> system.backend 'frontend uses backend'
        system.frontend <- system.backend

        style * {
          color red
        }
        autoLayout BottomTop
      }
    `)
  })

  it('valid dynamic view with tags and links', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        #epic-123 #next
        title 'System Context'
        description: "
          Index view description
        ";
        link https://domain.com/path

        user -> system.frontend 'User uses System'
        system.frontend -> system.backend 'frontend uses backend'
        system.frontend <- system.backend

        style * {
          color red
        }
        autoLayout BottomTop
      }
    `)
  })

  it('valid dynamic view with notes', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        user -> system.frontend 'User uses System'
        system.frontend -> system.backend 'frontend uses backend'
        system.frontend <- system.backend {
          title 'backend uses frontend'
          notes 'some note'
        }

        style * {
          color red
        }
        autoLayout BottomTop
      }
    `)
  })

  it('valid dynamic view with markdown notes', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        user -> system.frontend 'User uses System'
        system.frontend -> system.backend 'frontend uses backend'
        system.frontend <- system.backend {
          title 'backend uses frontend'
          notes: """
            # Title
            - bullet
          """
        }

        style * {
          color red
        }
        autoLayout BottomTop
      }
    `)
  })

  it('valid dynamic view with correct navigateTo', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view view1 {
        user -> system.frontend 'User uses System' {
          navigateTo view2
        }
      }
      dynamic view view2 {
        system.frontend -> system.backend 'frontend uses backend' {
          navigateTo view1
        }
      }
    `)
  })

  it('valid dynamic view with parallel steps', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view parallelSteps {
        parallel {
          user -> system.frontend 'User uses System'
          system.frontend -> system.backend 'frontend uses backend'
        }
        parallel {
          system.frontend <- system.backend
        }
      }
    `)
  })

  it('valid dynamic view with empty parallel steps', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view parallelSteps {
        parallel {
        }
        parallel {
          system.frontend <- system.backend 'frontend uses backend' {
            description 'some description'
          }
        }
      }
    `)
  })

  it('invalid dynamic view with nested parallel steps', async ctx => {
    const { invalid } = await mkTestServices(ctx)
    await invalid(`
      dynamic view parallelSteps {
        parallel {
          user -> system.frontend 'User uses System'
          system.frontend -> system.backend 'frontend uses backend'

          parallel {
            system.frontend <- system.backend
          }
        }
      }
    `)
  })

  it('invalid views', async ctx => {
    const { invalid } = await mkTestServices(ctx)
    await invalid(`
      dynamic view index2 {
        - asd - asd
      }
    `)
  })

  // --- WI-1: new sequence-parity constructs ---

  it('valid dynamic view with if block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        if 'inventory available' {
          user -> system.frontend 'User uses System'
        }
      }
    `)
  })

  it('valid dynamic view with if-else block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        if 'inventory available' {
          user -> system.frontend 'success'
        } else {
          user -> system.frontend 'failure'
        }
      }
    `)
  })

  it('valid dynamic view with if-else if-else block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        if 'cond A' {
          user -> system.frontend 'A'
        } else if 'cond B' {
          user -> system.backend 'B'
        } else {
          user -> system.frontend 'fallback'
        }
      }
    `)
  })

  it('valid dynamic view with optional block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        optional 'customer opted-in' {
          user -> system.frontend 'send confirmation'
        }
      }
    `)
  })

  it('valid dynamic view with repeat block (with label)', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        repeat 'for each item' {
          system.frontend -> system.backend 'process item'
        }
      }
    `)
  })

  it('valid dynamic view with repeat block (without label)', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        repeat {
          system.frontend -> system.backend 'process item'
        }
      }
    `)
  })

  it('valid dynamic view with parallel labeled branches', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        parallel {
          branch 'sync read' {
            user -> system.frontend 'read'
          }
          branch 'cache refresh' {
            system.frontend -> system.backend 'refresh'
          }
        }
      }
    `)
  })

  it('valid dynamic view with group block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        group 'Authentication flow' {
          user -> system.frontend 'login'
          system.frontend -> system.backend 'verify'
        }
      }
    `)
  })

  it('valid dynamic view with critical block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        critical 'place order' {
          user -> system.frontend 'submit'
        } on 'timeout' {
          system.frontend -> system.backend 'rollback'
        }
      }
    `)
  })

  it('valid dynamic view with break block', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        break 'rate limit exceeded' {
          system.frontend -> system.backend 'error'
        }
      }
    `)
  })

  it('valid dynamic view with note over two actors', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        user -> system.frontend 'step'
        note over user, system.frontend 'Session established'
      }
    `)
  })

  it('valid dynamic view with note left of actor', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        user -> system.frontend 'step'
        note left of user 'User initiates'
      }
    `)
  })

  it('valid dynamic view with note right of actor', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        user -> system.frontend 'step'
        note right of system.frontend 'Frontend responds'
      }
    `)
  })

  it('valid dynamic view with activate and deactivate', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        activate user
        user -> system.frontend 'step'
        deactivate user
      }
    `)
  })

  it('valid dynamic view with create and destroy', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        create system.frontend
        user -> system.frontend 'step'
        destroy system.frontend
      }
    `)
  })

  it('valid dynamic view with autonumber (bare)', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        autonumber
        user -> system.frontend 'step'
      }
    `)
  })

  it('valid dynamic view with autonumber true', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        autonumber true
        user -> system.frontend 'step'
      }
    `)
  })

  it('valid dynamic view with autonumber false', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        autonumber false
        user -> system.frontend 'step'
      }
    `)
  })

  it('valid dynamic view with autonumber from N step M', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        autonumber from 1 step 2
        user -> system.frontend 'step'
      }
    `)
  })

  it('valid dynamic view with deeply nested blocks', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view v1 {
        if 'condition a' {
          repeat 'for each item' {
            parallel {
              branch 'branch c' {
                user -> system.frontend 'A'
              }
              branch 'branch d' {
                system.frontend -> system.backend 'B'
              }
            }
          }
        }
      }
    `)
  })

  it('backward compat: legacy flat parallel { stepA stepB } still parses', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view parallelSteps {
        parallel {
          user -> system.frontend 'User uses System'
          system.frontend -> system.backend 'frontend uses backend'
        }
        parallel {
          system.frontend <- system.backend
        }
      }
    `)
  })

  //  it.skip('valid views example', async ctx => {
  //   const { valid } = await mkTestServices(ctx)
  //   await valid(`
  //     dynamic view index1 {
  //       user
  //         -> system.frontend 'User uses System'
  //          -> system.backend 'System uses Backend'
  //          <- 'System uses Backend'
  //         <-

  //       user -> system.frontend 'User uses System' {
  //         -> system.backend 'System uses Backend' {
  //           <- 'System uses Backend'
  //         }
  //         <-
  //       }

  //          1.1. -> system.backend {

  //          }
  //          1.2. <- system.backend

  //       2. system.frontend -> system.backend
  //           'System uses Backend'

  //       system.backend -> system.frontend
  //     }
  //   `)
  // })
})
