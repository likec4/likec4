import { describe, test } from 'vitest'
import type { URI } from 'vscode-uri'
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

const it = test.extend<{
  $file: {
    t: ReturnType<typeof createTestServices>
  }
}>({
  t: [async ({}, use) => {
    using srv = createTestServices()
    await srv.validate(model)
    await use(srv)
  }, { scope: 'file' }],
}).extend('expectView', async ({ t, task }, { onCleanup }) => {
  const cleanup: URI[] = []
  onCleanup(async () => {
    await t.services.shared.workspace.DocumentBuilder.update([], cleanup)
  })
  return (view: string) => {
    const validate = async () => {
      const result = await t.validate(`
            views {
              ${view}
            }
            `)
      cleanup.push(result.document.uri)
      return result
    }
    return ({
      toBeInvalid: async () => {
        const { diagnostics } = await validate()
        if (diagnostics.length === 0) {
          return task.context.expect.assert.fail('Expected validation errors but none were found')
        }
      },
      toBeValid: async () => {
        const { formattedError } = await validate()
        if (formattedError) {
          await task.context.annotate(formattedError)
          return task.context.expect.assert.fail('View validation failed')
        }
      },
    })
  }
})

describe('dynamic views - flow blocks', () => {
  describe('try-catch-finally', () => {
    it('valid try only', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          try {
            system.frontend -> system.backend 'frontend uses backend'
            system.frontend <- system.backend
          }
          
          autoLayout BottomTop
        }
      `).toBeValid()
    })

    it('valid try only with title', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          try 'Try block' {
            system.frontend -> system.backend 'frontend uses backend'
            system.frontend <- system.backend
          }
          
          autoLayout BottomTop
        }
      `).toBeValid()
    })

    it('valid try with catch', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          try {
            system.frontend -> system.backend 'frontend uses backend'
          } catch {
            system.frontend <- system.backend
          }
          
          try {         
            // Second try block - empty
          } catch {
            system.frontend <- system.backend
          }
        }
      `).toBeValid()
    })

    it('valid try with finally', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          try {
            system.frontend
              -> system.backend
              -> system.frontend
          } finally {
            system.frontend -> system.backend
          }
        }
      `).toBeValid()
    })

    it('valid try with catch and finally', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          try {
            system.frontend
              -> system.backend
              -> system.frontend
          } catch {
            system.frontend <- system.backend
          } finally {
            system.frontend -> system.backend
          }
        }
      `).toBeValid()
    })

    it('invalid catch', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          catch {
            system.frontend -> system.backend
          }
        }
      `).toBeInvalid()
    })

    it('invalid catch after finally', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          user -> system.frontend 'User uses System'
          try {
            system.frontend
              -> system.backend
              -> system.frontend
          } finally {
            system.frontend <- system.backend
          } catch {
            system.frontend -> system.backend
          }
        }
      `).toBeInvalid()
    })

    it('invalid try inside alt', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          alt {
            try {
              system.frontend -> system.backend
            }
          }
        }
      `).toBeInvalid()
    })
  })

  describe('alt', () => {
    it('valid alt', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          alt {
            when 'Condition 1' {
              system.frontend -> system.backend 'frontend uses backend'
            }            
          }
        }
      `).toBeValid()
    })

    it('valid alt with multiple branches', async ({ expectView }) => {
      await expectView(`
        dynamic view index1 {
          alt {
            when 'Condition 1' {
              system.frontend -> system.backend 'frontend uses backend'
            }
            when 'Condition 2' {
              user -> system.frontend
            }
            else {
              system.frontend -> system.backend
            }
          }
        }
      `).toBeValid()
    })
  })

  it('opt block', async ({ expectView }) => {
    await expectView(`
      dynamic view index1 {
        opt ' srsrs' {
          system.frontend -> system.backend 'frontend uses backend'
        }
      }
    `).toBeValid()
  })

  it('loop block', async ({ expectView }) => {
    await expectView(`
      dynamic view index1 {
        loop {
          system.frontend -> system.backend 'frontend uses backend'
        }
      }
    `).toBeValid()
  })

  it('par block', async ({ expectView }) => {
    await expectView(`
      dynamic view index1 {
        par {
          system.frontend -> system.backend 'frontend uses backend'
        }
      }
    `).toBeValid()
  })

  it('parallel block', async ({ expectView }) => {
    await expectView(`
      dynamic view index1 {
        parallel {
          system.frontend
              -> system.backend
          system.frontend
              -> system.backend
              -> system.frontend
        }
      }
    `).toBeValid()
  })

  it('nested blocks', async ({ expectView }) => {
    await expectView(`
      dynamic view index1 {
        loop {
          try {
            alt {
              when 'Condition 1' {
                system.frontend -> system.backend
              }
              when 'Condition 2' {
                user -> system.frontend
              }
              else {
                opt {
                  user -> system
                }
              }
            }
          } finally {
            system.frontend <- system.backend
          }
        }
      }
    `).toBeValid()
  })
})
