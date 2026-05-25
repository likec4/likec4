import { type Fqn, type XYPoint, invariant } from '@likec4/core'
import { randomId } from '@mantine/hooks'
import { type SnapshotFromStore, createStore, fromStore } from '@xstate/store'
import { useStore } from '@xstate/store-react'
import { createJSONStorage, persist } from '@xstate/store/persist'
import { castDraft, produce } from 'immer'
import { useMemo } from 'react'
import { filter, indexBy, map, pipe, prop } from 'remeda'
import type { SetOptional } from 'type-fest'
import { createActor } from 'xstate'
import { roundDpr } from '../../utils/roundDpr'
import type { WindowId, WindowState } from './types'

export type Position = Readonly<{
  top: number
  left: number
}>

export interface FloatingWindowContext {
  id: WindowId
  state: WindowState
  pos: Position
}

export const createFloatingWindowStore = ({
  input,
}: {
  input: {
    id: WindowId
    state?: WindowState
    pos?: Position
  }
}) =>
  createStore({
    context: {
      pos: { top: 60, left: 320 },
      state: 'visible',
      ...input,
    } as FloatingWindowContext,
    on: {
      'open': (context, event: {}) =>
        produce(context, draft => {
          draft.state = 'visible'
        }),
      'minimize': (context, event: {}) => {
        return {
          ...context,
          state: 'minimized' as const,
        }
      },
      'close': (context, event: {}, enqueue) => {
        return {
          ...context,
          state: 'hidden' as const,
        }
      },
      'moveByOffset': (context, event: { offset: XYPoint }) => {
        return {
          ...context,
          pos: {
            top: roundDpr(context.pos.top + event.offset.y),
            left: roundDpr(context.pos.left + event.offset.x),
          },
        }
      },
    },
  }).with(
    persist({
      name: `likec4:window:${input.id}`,
      storage: createJSONStorage(() => sessionStorage),
      throttle: 500,
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        pos: input.pos ?? persisted.pos ?? current.pos,
        state: input.state ?? persisted.state ?? 'visible',
      }),
    }),
  )

export type FloatingWindowStore = ReturnType<typeof createFloatingWindowStore>

export function useFloatingWindowStore(input: {
  id: WindowId
  state?: WindowState
  pos?: Position
}): FloatingWindowStore {
  return useMemo(() =>
    createFloatingWindowStore({
      input,
    }), [input.id])
}

// const store = fromStore({
//   context: {
//     windows: {} as Readonly<Record<WindowId, FloatingWindow>>,
//     visible: [] as ReadonlyArray<WindowId>,
//   },
//   emits: {
//     inputKeyDown: (payload: {}) => {
//     },
//   },
//   on: {
//     'openWindow': (context, event: { newWindow: SetOptional<FloatingWindow, 'id'> }) =>
//       produce(context, draft => {
//         const id = event.newWindow.id ?? (randomId() as WindowId)
//         invariant(!context.windows[id], 'Window with id ' + id + ' already exists')
//         draft.windows[id] = {
//           ...event.newWindow,
//           visible: true,
//           id,
//         }
//         draft.visible.push(id)
//       }),
//     'closeWindow': (context, event: { id: WindowId }) =>
//       produce(context, draft => {
//         const index = draft.visible.indexOf(event.id)
//         if (index !== -1) {
//           draft.visible.splice(index, 1)
//         }
//         draft.windows[event.id]!.visible = false
//       }),
//   },
// })

// const actor = createActor(store)
// actor.start()
// actor.send({ type: 'closeWindow', id: 'test' })
// actor.select(s -=</>)
