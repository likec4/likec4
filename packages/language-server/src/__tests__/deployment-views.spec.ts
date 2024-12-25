import { describe, it, type TestContext } from 'vitest'
import { createTestServices } from '../test/testServices'

const model = `
  specification {
    element component
    deploymentNode environment
    deploymentNode node
    deploymentNode zone
    tag epic-123
    tag next
    relationship https
  }
  model {
    component user
    component system {
      component backend {
        component model
        component api
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
  deployment {
    node user {
      instanceOf user
    }
    environment dev {
      node backend {
        instanceOf backend.model
        instanceOf backend.api
      }
      node devnode {
        instanceOf auth.api
        instanceOf frontend
      }
      node database {
        instanceOf infra.database
      }
    }
    environment prod {
      zone z1 {
        node frontend {
          instanceOf frontend
        }
        node backend {
          instanceOf backend.model
          instanceOf backend.api
        }
      }
      zone z2 {
        node frontend {
          instanceOf frontend
        }
        node backend {
          instanceOf backend.model
          instanceOf backend.api
        }
      }
      node shared {
        instanceOf auth.api
        instanceOf infra.database
      }
    }
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
      deployment view tmp {
        ${rules}
      }
    `)

  return {
    view: {
      valid: async (view: string) => {
        const { errors, warnings } = await validateView(view)
        expect(errors.concat(warnings).join('\n')).toEqual('')
      },
      invalid: async (view: string) => {
        const { errors } = await validateView(view)
        expect(errors).not.toEqual([])
      }
    },
    valid: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect(errors.join('\n'), 'errors').to.be.empty
      expect(warnings.join('\n'), 'warnings').to.be.empty
    },
    onlyWarnings: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect(errors.join('\n'), 'errors').to.be.empty
      expect(warnings.join('\n'), 'warnings').not.to.be.empty
    },
    invalid: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect(errors.join('\n'), 'errors').not.to.be.empty
      expect(warnings.join('\n'), 'warnings').to.be.empty
    }
  }
}

describe.concurrent('Deployment views:', () => {
  it('valid views', async ctx => {
    const { view } = await mkTestServices(ctx)
    await view.valid(`
      deployment view index {
      }
    `)

    await view.valid(`
      deployment view index1 {
        title 'Index'
      }
    `)

    await view.valid(`
      deployment view index2 {
        #epic-123 #next
        title 'with title'
        description 'with description'
      }
    `)
  })

  it('invalid views', async ctx => {
    const { view } = await mkTestServices(ctx)
    await view.valid(`
      deployment view index {
      }
    `)
    // Fail for same name
    await view.invalid(`
      deployment view index {
      }
    `)
    await view.invalid(`
      deployment view system.backend {
      }
    `)
    await view.invalid(`
      deployment view of system {
      }
    `)
  })

  it('valid rules', async ctx => {
    const { valid } = await mkTestServices(ctx)

    await valid(`
      include * -> *
      include * -> * where tag is #next
      include * -> * where kind is https or tag is #next
    `)
  })
})
