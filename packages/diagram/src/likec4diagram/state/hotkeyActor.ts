import { getHotkeyHandler } from '@mantine/hooks'
import type { KeyboardEvent } from 'react'
import { type AnyEventObject, type CallbackActorLogic, type NonReducibleUnknown, fromCallback } from 'xstate'
import { isEventFromSearch } from '../../utils/search-event'

export type HotKeyEvent = { type: 'key.esc' | `key.arrow.${'left' | 'right' | 'up' | 'down'}` }

export interface HotkeyActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, HotKeyEvent> {}

export const hotkeyActorLogic: HotkeyActorLogic = fromCallback(({ sendBack }: {
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
    ['ArrowUp', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'key.arrow.up' })
    }, {
      preventDefault: true,
    }],
    ['ArrowRight', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'key.arrow.right' })
    }, {
      preventDefault: true,
    }],
    ['ArrowDown', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'key.arrow.down' })
    }, {
      preventDefault: true,
    }],
  ])
  // Leave keys pressed in the search overlay to the search
  const onEsc = (event: globalThis.KeyboardEvent) => {
    if (!isEventFromSearch(event)) {
      escHandler(event)
    }
  }
  const onArrows = (event: globalThis.KeyboardEvent) => {
    if (!isEventFromSearch(event)) {
      arrowshandler(event)
    }
  }
  document.body.addEventListener('keydown', onEsc)
  document.body.addEventListener('keydown', onArrows, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', onEsc)
    document.body.removeEventListener('keydown', onArrows, { capture: true })
  }
})
