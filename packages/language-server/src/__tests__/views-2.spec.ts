// oxlint-disable vitest/expect-expect
import { describe, test } from 'vitest'
import type { URI } from 'vscode-uri'
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
        component _underscore
        component __underscore
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

const it = test.extend<{
  $file: {
    t: ReturnType<typeof createTestServices>
  }
  $test: {
    valid: (rules: string) => Promise<void>
    onlyWarnings: (rules: string) => Promise<void>
    invalid: (rules: string) => Promise<void>
    view: {
      valid: (view: string) => Promise<void>
      invalid: (view: string) => Promise<void>
    }
  }
}>({
  t: [async ({}, use) => {
    using t = createTestServices()
    await t.validate(model, 'model.c4')
    await use(t)
  }, { scope: 'file' }],
  view: async ({ t, task }, use) => {
    const cleanup = [] as Array<URI>
    await use({
      async valid(view) {
        const { errors, warnings, document } = await t.validate(`
          views {
            ${view}
          }
        `)
        cleanup.push(document.uri)
        task.context.expect(errors.join('\n'), 'errors').to.be.empty
        task.context.expect(warnings.join('\n'), 'warnings').to.be.empty
      },
      async invalid(view) {
        const { errors, document } = await t.validate(`
          views {
            ${view}
          }
        `)
        cleanup.push(document.uri)
        task.context.expect(errors, 'errors').not.to.be.empty
      },
    })
    if (cleanup.length > 0) {
      await t.services.shared.workspace.DocumentBuilder.update([], cleanup)
    }
  },
  valid: async ({ view }, use) => {
    await use(async (rules) => {
      await view.valid(`
        view {
          ${rules}
        }
      `)
    })
  },
  invalid: async ({ view }, use) => {
    await use(async (rules) => {
      await view.invalid(`
        view {
          ${rules}
        }
      `)
    })
  },
  onlyWarnings: async ({ t, task }, use) => {
    const cleanup = [] as Array<URI>
    await use(async (rules) => {
      const { errors, warnings, document } = await t.validate(`
        views {
          view {
            ${rules}
          }
        }
      `)
      cleanup.push(document.uri)
      task.context.expect(errors.join('\n'), 'errors').to.be.empty
      task.context.expect(warnings.join('\n'), 'warnings').not.to.be.empty
    })
    if (cleanup.length > 0) {
      await t.services.shared.workspace.DocumentBuilder.update([], cleanup)
    }
  },
})

describe('views2', () => {
  it('valid views', async ({ view: { valid, invalid } }) => {
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

  it('view scope', async ({ view: { valid, invalid } }) => {
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

  it('view properties', async ({ view: { valid } }) => {
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

  it('autoLayout and rules order', async ({ view: { valid } }) => {
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

  describe('include', () => {
    it('element', async ({ valid, invalid }) => {
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
      await invalid(`
        # no comma
        include system.backend system.model
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

    it('element._', async ({ valid, invalid }) => {
      await valid(`
        include system._
        include
          system._,
          system._underscore,
          system.__underscore,
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
      await valid(`
        exclude system._
      `)
    })

    it('element with { }', async ({ valid, invalid, onlyWarnings }) => {
      await invalid(`
        exclude system.backend.api with { }
      `)
      await valid(`
        include system.backend.* with { }
      `)
      await valid(`
        include system._ with { }
      `)
      await invalid(`
        include system.backend with {
      `)
      await valid(`
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

    it('element {... props}', async ({ valid, invalid }) => {
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
          multiple true
        }
      `)
      await valid(`
        include system.backend with {
          multiple false
        }
      `)
    })

    it('element [navigateTo]', async ({ view }) => {
      await view.valid(`
        view someview {
          include *
        }
        view someview2 {
          include system.backend.api with {
            navigateTo someview
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

    it('-> element', async ({ valid, onlyWarnings }) => {
      await onlyWarnings(`
        include -> *
      `)
      await valid(`
        include -> system.backend.api
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

    it('-> element ->', async ({ valid, invalid }) => {
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

    it('element -> element', async ({ valid, invalid }) => {
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

    it('element -> element with { ... }', async ({ valid, invalid }) => {
      await valid(`
        include * -> * with {
          title 'aa'
          description 'bb'
          technology 'cc'
          color red
          line dotted
          head normal
          tail none
        }
      `)
      await valid(`
        include * -> * with {
          title 'aa'
          notation 'bb'
        }
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

    it('element <-> element', async ({ valid, invalid }) => {
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

    it('element ->', async ({ valid, invalid, onlyWarnings }) => {
      await onlyWarnings(`
        include * ->,
      `)
      await onlyWarnings(`
        include * <->,
      `)
      await valid(`
        include system ->,
      `)
      await valid(`
        include system.backend.* ->,
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

    it('element.kind', async ({ valid, invalid }) => {
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

    it('element where metadata', async ({ valid }) => {
      await valid(`
        include * where metadata.env is "production"
      `)
      await valid(`
        include * where metadata.env is not "staging"
      `)
      await valid(`
        include * where metadata.version
      `)
      await valid(`
        include * where not metadata.version
      `)
      await valid(`
        include *
          where metadata.env is "production"
            and kind is component
      `)
      await valid(`
        exclude * where metadata.env is "staging"
      `)
      await valid(`
        include * where metadata.env == "production"
      `)
      await valid(`
        include * where metadata.env != "staging"
      `)
      await valid(`
        include * where metadata.critical is true
      `)
      await valid(`
        include * where metadata.critical is not false
      `)
    })

    it('relation where metadata', async ({ valid }) => {
      await valid(`
        include * -> * where metadata.protocol is "grpc"
      `)
      await valid(`
        include * -> * where metadata.version
      `)
      await valid(`
        include * -> * where source.metadata.env is "prod"
      `)
      await valid(`
        include * -> * where target.metadata.env is "staging"
      `)
      await valid(`
        include * -> *
          where metadata.protocol is "grpc"
            and tag is not #next
      `)
    })

    it('element.tag', async ({ valid, invalid }) => {
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

  describe('style', () => {
    it('element', async ({ valid }) => {
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

    it('element.kind/tag', async ({ valid }) => {
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

    it('with notation', async ({ valid, invalid }) => {
      await invalid(`
        style * {
          notation
          color secondary
        }
      `)
      await valid(`
        style * {
          color secondary
          notation 'dev'
        }
      `)
    })
  })

  describe('groups', () => {
    it('parse group', async ({ valid }) => {
      await valid(`
        include *
        group {
          include *
        }
      `)
      await valid(`
        group 'Backend' {
          include system.backend
        }
        group '' {
          include *
            where tag is #next
            with {
              title ''
            }
          exclude system.frontend
        }
      `)
    })

    it('parse nested groups', async ({ valid }) => {
      await valid(`
        group {
          color red
          group 'Backend' {
            border solid
            include system.backend
          }
          group 'Frontend' {
            opacity 10%
            include system.frontend
          }
          exclude system
        }
      `)
    })
  })
})
