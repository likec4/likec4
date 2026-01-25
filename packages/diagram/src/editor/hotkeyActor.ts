import { getHotkeyHandler } from '@mantine/hooks'
import type { AnyEventObject, CallbackActorLogic, NonReducibleUnknown } from 'xstate'
import { fromCallback } from 'xstate'

export type HotKeyEvent = { type: 'undo' }

export interface HotkeyActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, HotKeyEvent> {}

export const hotkeyActorLogic: HotkeyActorLogic = fromCallback(({ sendBack }: {
  sendBack: (event: HotKeyEvent) => void
}) => {
  const ctrlZHandler = getHotkeyHandler([
    ['mod + z', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'undo' })
    }, {
      preventDefault: true,
    }],
  ])

  document.body.addEventListener('keydown', ctrlZHandler, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', ctrlZHandler, { capture: true })
  }
})
