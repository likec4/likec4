import { useSessionStorage } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { current } from 'immer'
import { useCallback } from 'react'
import type { FloatingWindowsActorRef } from './actor/actor'
import type { WindowId, WindowState } from './actor/types'
import type { FloatingWindowProps } from './FloatingWindow'

export function useFloatingWindow(props: {
  id: WindowId
  actorRef: FloatingWindowsActorRef
}): Required<
  Pick<
    FloatingWindowProps,
    | 'position'
    | 'width'
    | 'height'
    | 'onPositionChange'
    | 'onResize'
    | 'onClose'
    | 'onMinimize'
  >
> {
  const { id, actorRef } = props
  const [persisted, setPersisted] = useSessionStorage({
    key: `likec4:window:${id}`,
    defaultValue: {
      position: {
        top: 60,
        left: 32,
      },
      width: 0,
      height: 0,
      state: 'visible' as WindowState,
    },
    getInitialValueInEffect: false,
  })
  // const { state } = useSelector(
  //   actorRef,
  //   useCallback(({ context }) => ({
  //     state: context.opened.has(id) ? 'visible' as const : 'hidden' as const,
  //   }), [id]),
  //   shallowEqual,
  // )
  // TODO: implement
  return {
    ...persisted,
    onResize(width, height) {
      setPersisted(current => ({
        ...current,
        width,
        height,
      }))
    },
    onPositionChange(position) {
      // actorRef.send({ type: 'window.move', id, position })
      setPersisted(current => ({
        ...current,
        position,
      }))
    },

    onClose: () => {
      actorRef.send({ type: 'window.close', id })
    },
    onMinimize: () => {
      actorRef.send({ type: 'window.minimize', id })
    },
  }
}
