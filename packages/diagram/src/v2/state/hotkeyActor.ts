import { getHotkeyHandler } from '@mantine/hooks'
import { type AnyEventObject, type NonReducibleUnknown, fromCallback } from 'xstate'

export type HotKeyEvent = { type: 'key.esc' | `key.arrow.${'left' | 'right'}` }
export const hotkeyActor = fromCallback<AnyEventObject, NonReducibleUnknown, HotKeyEvent>(({ sendBack }: {
  sendBack: (event: HotKeyEvent) => void
}) => {
  const handler = getHotkeyHandler([
    ['Escape', () => sendBack({ type: 'key.esc' }), {
      preventDefault: true,
    }],
    ['ArrowLeft', () => sendBack({ type: 'key.arrow.left' })],
    ['ArrowRight', () => sendBack({ type: 'key.arrow.right' })],
  ])
  document.body.addEventListener('keydown', handler, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', handler, { capture: true })
  }
})
