import { getHotkeyHandler } from '@mantine/hooks'
import {
  type AnyEventObject,
  type CallbackActorLogic,
  type NonReducibleUnknown,
  fromCallback,
} from 'xstate'

export type HotKeyEvent = { type: 'undo' }

export interface HotkeyActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, HotKeyEvent> {}

export const hotkeyActorLogic: HotkeyActorLogic = fromCallback(({ sendBack }: {
  sendBack: (event: HotKeyEvent) => void
}) => {
  console.info('hotkey actor started')
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
    console.info('hotkey actor stopped')
    document.body.removeEventListener('keydown', ctrlZHandler, { capture: true })
  }
})
