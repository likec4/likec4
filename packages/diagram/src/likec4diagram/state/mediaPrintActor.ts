import { type AnyEventObject, type CallbackActorLogic, type NonReducibleUnknown, fromCallback } from 'xstate'

export type MediaPrintEvent =
  | { type: 'media.print.on' }
  | { type: 'media.print.off' }

export interface MediaPrintActorLogic
  extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, MediaPrintEvent>
{}

/**
 * Actor logic to listen for media print events.
 */
export const mediaPrintActorLogic: MediaPrintActorLogic = fromCallback(({ sendBack }: {
  sendBack: (event: MediaPrintEvent) => void
}) => {
  const beforePrint = () => {
    sendBack({ type: 'media.print.on' })
  }

  const afterPrint = () => {
    sendBack({ type: 'media.print.off' })
  }

  window.addEventListener('beforeprint', beforePrint)
  window.addEventListener('afterprint', afterPrint)
  return () => {
    window.removeEventListener('beforeprint', beforePrint)
    window.removeEventListener('afterprint', afterPrint)
  }
})
