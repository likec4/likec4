import { describe, vi } from 'vitest'
import { isLikeC4UserDocument } from '../ast'
import { test as base } from '../test'

const modelWith = (body: string) => `
  specification {
    element component
  }
  model {
    component sys1
    component sys2
    ${body}
  }
`

const test = base.extend('listener', async ({ t }, { onCleanup }) => {
  const listener = vi.fn()
  const subscription = t.services.shared.workspace.DocumentBuilder.onDocumentValidationChanged({
    select: ({ validationHash, hasErrors }) => ({ validationHash, hasErrors }),
    // builtin documents are notified as well, we track only user documents
    listener: params => isLikeC4UserDocument(params.doc) && listener(params),
  })
  onCleanup(() => subscription.dispose())
  return listener
})

describe('LikeC4DocumentBuilder', () => {
  describe('onDocumentValidationChanged', () => {
    test('notifies on first validation', async ({ t, listener, expect }) => {
      const { document } = await t.validate(modelWith('sys1 -> unknown'))

      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
        firstTime: true,
        previous: undefined,
        current: expect.objectContaining({
          hasErrors: true,
        }),
        hasErrors: true,
        isValid: false,
      }))

      // Now let's validate the same document again
      await t.edit(document, modelWith('sys2 -> unknown'))
      expect(listener).toHaveBeenCalledOnce()

      // Now let's validate the same document again
      await t.edit(document, modelWith('//sys1-> sys2'))
      expect(listener).toHaveBeenCalledTimes(2)

      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
        doc: expect.anything(),
        firstTime: false,
        current: expect.objectContaining({
          hasErrors: false,
        }),
        previous: expect.objectContaining({
          hasErrors: true,
          'validationHash': expect.any(String),
        }),
        hasErrors: false,
        isValid: true,
      }))
    })

    test('does not notify if the same error remains after edit', async ({ t, listener, expect }) => {
      const { document } = await t.validate(modelWith('sys1 -> unknown'))
      listener.mockClear()

      await t.edit(
        document,
        modelWith(`
          // user is typing something
          sys1 -> unknown
        `),
      )

      expect(document.diagnostics?.length).toBeGreaterThan(0)
      expect(listener).not.toHaveBeenCalled()
    })

    test('notifies if error changes', async ({ t, listener, expect }) => {
      const { document } = await t.validate(modelWith('sys1 -> unknown'))
      listener.mockClear()

      await t.edit(document, modelWith('sys1 -> another'))

      expect(listener).toHaveBeenCalledOnce()
      const [{ previous, current, hasErrors }] = listener.mock.lastCall!
      expect(hasErrors).toBe(true)
      expect(previous).toBeDefined()
      expect(current).not.toEqual(previous)
    })

    test('notifies when error is fixed', async ({ t, listener, expect }) => {
      const { document } = await t.validate(modelWith('sys1 -> unknown'))
      listener.mockClear()

      await t.edit(document, modelWith('sys1 -> sys2'))

      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
        hasErrors: false,
        isValid: true,
      }))
    })

    test('does not notify on edits without errors', async ({ t, listener, expect }) => {
      const { document } = await t.validate(modelWith('sys1 -> sys2'))
      listener.mockClear()

      await t.edit(document, modelWith('sys2 -> sys1'))

      expect(listener).not.toHaveBeenCalled()
    })

    test('stops notifying after dispose', async ({ t, expect }) => {
      const listener = vi.fn()
      const disposable = t.services.shared.workspace.DocumentBuilder.onDocumentValidationChanged({ listener })
      disposable.dispose()

      await t.validate(modelWith('sys1 -> unknown'))

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
