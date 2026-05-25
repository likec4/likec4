import { type Fqn, invariant } from '@likec4/core'
import { randomId } from '@mantine/hooks'
import { type SnapshotFromStore, createStore, fromStore } from '@xstate/store'
import { castDraft, produce } from 'immer'
import { filter, indexBy, map, pipe, prop } from 'remeda'
import type { SetOptional, Tagged } from 'type-fest'
import { createActor } from 'xstate'

export type WindowId = Tagged<string, 'WindowId'>

export type Position = Readonly<{
  top: number
  left: number
}>

export type FloatingWindow = Readonly<{
  id: WindowId
  visible: boolean
  pos: Position
}>

export const createFloatingWindowStore = ({
  initial,
  sideEffects,
}: {
  initial: FloatingWindow[]
  sideEffects: {
    onElementStateClick: (payload: { id: Fqn }) => void
  }
}) =>
  createStore({
    context: {
      windows: indexBy(initial, w => w.id) as Readonly<Record<WindowId, FloatingWindow>>,
      visible: pipe(
        initial,
        filter(prop('visible')),
        map(prop('id')),
      ) as ReadonlyArray<WindowId>,
    },
    emits: {
      inputKeyDown: (payload: {}) => {
      },
    },
    on: {
      'openWindow': (context, event: { newWindow: SetOptional<FloatingWindow, 'id'> }) =>
        produce(context, draft => {
          const id = event.newWindow.id ?? (randomId() as WindowId)
          invariant(!context.windows[id], 'Window with id ' + id + ' already exists')
          draft.windows[id] = {
            ...event.newWindow,
            visible: true,
            id,
          }
          draft.visible.push(id)
        }),
      'closeWindow': (context, event: { id: WindowId }) =>
        produce(context, draft => {
          const index = draft.visible.indexOf(event.id)
          if (index !== -1) {
            draft.visible.splice(index, 1)
          }
          draft.windows[event.id]!.visible = false
        }),
    },
  })

export type FloatingWindowStore = ReturnType<typeof createFloatingWindowStore>

export type FloatingWindowContext = SnapshotFromStore<FloatingWindowStore>['context']

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
