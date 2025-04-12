import { getHotkeyHandler } from '@mantine/hooks'
import type { KeyboardEvent } from 'react'
import { type AnyEventObject, type NonReducibleUnknown, fromCallback } from 'xstate'

export type HotKeyEvent = { type: 'key.esc' | `key.arrow.${'left' | 'right'}` }

export const hotkeyActorLogic = fromCallback<AnyEventObject, NonReducibleUnknown, HotKeyEvent>(({ sendBack }: {
  sendBack: (event: HotKeyEvent) => void
}) => {
  const escHandler = getHotkeyHandler([
    ['Escape', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'key.esc' })
    }, {
      preventDefault: true,
    }],
  ])

  const arrowshandler = getHotkeyHandler([
    ['ArrowLeft', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'key.arrow.left' })
    }, {
      preventDefault: true,
    }],
    ['ArrowRight', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'key.arrow.right' })
    }, {
      preventDefault: true,
    }],
  ])
  document.body.addEventListener('keydown', escHandler)
  document.body.addEventListener('keydown', arrowshandler, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', escHandler)
    document.body.removeEventListener('keydown', arrowshandler, { capture: true })
  }
})
