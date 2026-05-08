import { useStore } from '@nanostores/react'
import { atom, batched } from 'nanostores'

type ApplySemanticLayoutPayload = {
  type: 'started' | 'completed'
} | {
  log: string
}

const $log = atom<string>('')
const $status = atom<'closed' | 'processing' | 'completed'>('closed')

const $state = batched([$log, $status], (log, status) => ({ log, status }))

export function useSemanticLayoutLog() {
  return useStore($state)
}

export function closeSemanticLayoutLog() {
  $status.set('closed')
  $log.set('')
}

import.meta.hot?.on('likec4:apply-semantic-layout', (payload: ApplySemanticLayoutPayload) => {
  if ('type' in payload) {
    if (payload.type === 'started') {
      $status.set('processing')
      $log.set('')
    } else if (payload.type === 'completed') {
      $status.set('completed')
    }
  } else {
    $log.set($log.get() + payload.log)
  }
})
