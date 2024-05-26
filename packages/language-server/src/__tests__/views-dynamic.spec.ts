import { describe, it, type TestContext, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

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

describe.skip('dynamic views', () => {
  it('valid views', async ctx => {
    const { valid } = await mkTestServices(ctx)
    await valid(`
      dynamic view index1 {
        user
          -> system.frontend 'User uses System'
           -> system.backend 'System uses Backend'
           <- 'System uses Backend'
          <-


        user -> system.frontend 'User uses System' {
          -> system.backend 'System uses Backend' {
            <- 'System uses Backend'
          }
          <-
        }

           1.1. -> system.backend {

           }
           1.2. <- system.backend

        2. system.frontend -> system.backend
            'System uses Backend'

        system.backend -> system.frontend
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
})
