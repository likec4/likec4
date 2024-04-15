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

describe.concurrent('views2', () => {
  it('valid views', async ctx => {
    const {
      view: { valid, invalid }
    } = await mkTestServices(ctx)
    await valid(`
      view index {
      }
    `)
    await invalid(`
      view system.backend {
      }
    `)
    await valid(`
      view index2 of system.backend {
      }
    `)
    await valid(`
      view of system.backend {
      }
    `)
  })

  it('view scope', async ctx => {
    const {
      view: { valid, invalid }
    } = await mkTestServices(ctx)
    // inambiqutes "of"
    await invalid(`
      view of system {
        include api
      }
    `)
    await invalid(`
      view of system.api {
        include *
      }
    `)
    // resolve
    await valid(`
      view of system.auth {
        include api
      }
    `)
  })

  it('view properties', async ctx => {
    const {
      view: { valid }
    } = await mkTestServices(ctx)
    await valid(`
      view {
        title 'Index'
        description: "
          Index view description
        ";
        link https://domain.com/path

        include *
      }
    `)
    await valid(`
      view {
        #epic-123 #next
        title "Index";
        include *
      }
    `)
  })

  it('autoLayout and rules order', async ctx => {
    const {
      view: { valid }
    } = await mkTestServices(ctx)
    await valid(`
      view {
        include *
        style * {
          color: secondary
        }
        autoLayout BottomTop
        exclude -> infra
      }
      view {
        autoLayout LeftRight
        include *
      }
    `)
  })

  describe.concurrent('include', () => {
    it('element', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)
      await valid(`
        include *
      `)
      await valid(`
        include system.backend
      `)
      await invalid(`
        include ,
      `)
      await invalid(`
        include random
      `)
      // inambiqutes Two api: in backend and auth

      await invalid(`
        include system.api
      `)
      await valid(`
        include *, system.backend
      `)
      await valid(`
        exclude *, system,
        include infra,
      `)
      await valid(`
        include
          system.backend,
          system.backend.*,
          infra.*
      `)
      await valid(`
        exclude
          system.backend,
          system.backend.*,
          infra.*
      `)
    })

    it('element._', async ctx => {
      const { valid, invalid, onlyWarnings } = await mkTestServices(ctx)
      await valid(`
        include system._
      `)
      await valid(`
        include *
        style system._ {
        }
      `)
      await invalid(`
        include system.__
      `)
      await invalid(`
        include system ._
      `)
      await onlyWarnings(`
        include -> system._
      `)
      await onlyWarnings(`
        exclude system._
      `)
    })

    it('element { }', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)
      await invalid(`
        exclude system.backend.api with { }
      `)
      await invalid(`
        include system.backend.* with { }
      `)
      await invalid(`
        include system.backend with {
      `)
      await invalid(`
        include * with { }
      `)
      await valid(`
        include system.backend with { }
      `)
      await valid(`
        include
          system.backend.*,
          system.backend.api with {
          },
          system.model with  { },
      `)
    })

    it('element {... props}', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)
      await invalid(`
        include system.backend with  {
          title
        }
      `)
      await invalid(`
        include system.backend with  {
          style {
          }
        }
      `)
      await valid(`
        include system.backend with {
          title ''
          description ''
          technology '
          '
        }
      `)
      await valid(`
        include system.backend with {
          shape storage
          color green
        }
      `)
    })

    it('element [navigateTo]', async ctx => {
      const { view } = await mkTestServices(ctx)
      await view.valid(`
        view index {
          include *
        }
        view index2 {
          include system.backend.api with {
            navigateTo index
          }
        }
      `)
      await view.valid(`
        view index3 {
          include
            system with {
              navigateTo index3
            }
        }
      `)
      await view.invalid(`
        view {
          include system.backend.api with {
            navigateTo index11
          }
        }
      `)
    })

    it('-> element', async ctx => {
      const { valid, invalid, onlyWarnings } = await mkTestServices(ctx)
      await onlyWarnings(`
        include -> *
      `)
      await valid(`
        include -> system.backend.api
      `)
      await invalid(`
        include -> system.backend.api with {},
      `)
      await valid(`
        include -> system.backend.*
      `)
      await onlyWarnings(`
        include
          -> *,
          -> system.backend.api,
          -> system.backend.*
      `)
      await onlyWarnings(`
        exclude
          -> *
      `)
    })

    it('-> element ->', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)
      await valid(`
        include -> * ->
      `)
      await valid(`
        include -> system.backend.api ->
      `)
      await valid(`
        include -> system.backend.* ->
      `)
      await invalid(`
        include -> random.* ->
      `)
      await valid(`
        include
          -> * ->,
          -> system.backend.api ->,
          -> system.backend.* ->,
      `)
      await valid(`
        exclude
          -> * ->,
          -> system.backend.api ->,
          -> system.backend.* ->,
      `)
    })

    it('element -> element', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)

      await valid(`
        include * -> *
      `)
      await valid(`
        include system -> infra
      `)
      await invalid(`
        include system { } -> infra
      `)
      await valid(`
        include system.backend.* -> infra.*
      `)
      await invalid(`
        include system.backend.* -> random
      `)
      await valid(`
        include
          * -> *,
          * -> infra,
          * -> infra.*,
          system -> infra,
          system.backend.* -> infra.*,
          system.backend.* -> *
      `)
      await valid(`
        exclude
          * -> *,
          * -> infra,
          * -> infra.*,
          system -> infra,
          system.backend.* -> infra.*,
          system.backend.* -> *
      `)
    })

    it('element <-> element', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)

      await valid(`
        include * <-> *
      `)
      await valid(`
        include system <-> infra
      `)
      await invalid(`
        include system { } <-> infra
      `)
      await valid(`
        include system.backend.* <-> infra.*
      `)
      await invalid(`
        include system.backend.* <-> random
      `)
      await valid(`
        include
          * <-> *,
          * <-> infra,
          * <-> infra.*,
          system <-> infra,
          system.backend.* <-> infra.*,
          system.backend.* <-> *
      `)
      await valid(`
        exclude
          * <-> *,
          * <-> infra,
          * <-> infra.*,
          system <-> infra,
          system.backend.* <-> infra.*,
          system.backend.* <-> *
      `)
    })

    it('element ->', async ctx => {
      const { valid, invalid, onlyWarnings } = await mkTestServices(ctx)

      await onlyWarnings(`
        include * ->
      `)
      await invalid(`
        include * <->
      `)
      await valid(`
        include system ->
      `)
      await valid(`
        include system.backend.* ->
      `)
      await onlyWarnings(`
        include
          * ->,
          system ->,
          system.backend.* ->,
      `)
      await onlyWarnings(`
        exclude
          * ->,
          system ->,
          system.backend.* ->,
      `)
    })

    it('element.kind', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)

      await valid(`
        include element.kind = component
      `)
      await invalid(`
        include element.kind = cmp
      `)
      await valid(`
        include element.kind == component
      `)
      await valid(`
        include element.kind != component
      `)
      await valid(`
        include element.kind !== component
      `)
      await valid(`
        include
          element.kind = component,
          element.kind == component,
          element.kind != component,
      `)
      await valid(`
        exclude
          element.kind = component,
          element.kind == component,
          element.kind != component,
      `)
      await valid(`
        include
          -> element.kind = component,
          * -> element.kind == component,
          element.kind != component ->
      `)
    })

    it('element.tag', async ctx => {
      const { valid, invalid } = await mkTestServices(ctx)

      await valid(`
        include element.tag = #next
      `)
      await invalid(`
        include element.tag = #invalid
      `)
      await valid(`
        include element.tag == #epic-123
      `)
      await valid(`
        include element.tag != #next
      `)
      await valid(`
        include element.tag !== #next
      `)
      await valid(`
        include
          element.tag = #epic-123,
          element.tag == #next,
          element.tag != #epic-123,
      `)
      await valid(`
        exclude
          element.tag = #next,
          element.tag == #epic-123,
          element.tag != #epic-123,
      `)
      await valid(`
        include
          -> element.tag = #epic-123,
          * -> element.tag == #next,
          element.tag != #epic-123 ->
      `)
    })
  })

  describe.concurrent('style', () => {
    it('element', async ctx => {
      const { valid } = await mkTestServices(ctx)
      await valid(`
        style * {
          color secondary
        }
        style system, infra, {
          color: secondary
        }
      `)
      await valid(`
        style *, system.backend {
          color secondary
        }
      `)
      await valid(`
        style infra.*, system.backend.api {
          icon https://icons.terrastruct.com/dev%2Ftypescript.svg
        }
      `)
    })

    it('element.kind/tag', async ctx => {
      const { valid } = await mkTestServices(ctx)
      await valid(`
        style element.kind == component {
          color secondary
        }
      `)
      await valid(`
        style element.tag != #epic-123 {
          color secondary
        }
      `)
    })
  })
})
