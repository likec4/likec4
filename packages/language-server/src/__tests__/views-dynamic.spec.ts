import { describe, it, type TestContext, vi } from 'vitest'
import { createTestServices } from '../test'

const model = `
  specification {
    element component
    tag epic-123
    tag next
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

  const validateRules = (rules: string) =>
    validateView(`
      view {
        ${rules}
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
    }
  }
}

describe.concurrent('dynamic views', () => {
  it('valid dynamic view', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        title 'System Context'

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

  it('invalid views', async ctx => {
    const { invalid } = await mkTestServices(ctx)
    await invalid(`
      dynamic view index2 {
        - asd - asd
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
