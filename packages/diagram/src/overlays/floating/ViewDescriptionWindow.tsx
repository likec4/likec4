import { css } from '@likec4/styles/css'
import { Txt } from '@likec4/styles/jsx'
import { CloseButton, FloatingWindow, Group } from '@mantine/core'
import { deepEqual } from 'fast-equals'
import { m, useDragControls, useFollowValue } from 'motion/react'
import { ViewDetailsCard } from '../../components/ view-details/ViewDetailsCard'
import { useStore } from './hooks'
import type { WindowId } from './store'

export function ViewDescriptionFloatingWindow({ id }: { id: WindowId }) {
  // const { closeWindow } = useStore().trigger
  // const window = useStore(s => s.windows[id], deepEqual)
  // if (!window) {
  //   return null
  // }
  const controls = useDragControls()
  return (
    <m.div
      drag
      dragElastic={0}
      dragMomentum={false}
      // dragTransition={{
      //   bounceStiffness: 600,
      //   bounceDamping: 10,
      // }}
      whileDrag={{
        // scale: 1.01,
        // originY: 0.1,
        // translateY: -5,
        translateY: -1,
        boxShadow: '0px 12px 20px rgba(0,0,0,0.3)',
      }}
      // anc
      // dragControls={controls}
      // dragElastic={0}
      // dragMomentum={false}
      // dragListener={false}
      className={css({
        layerStyle: 'likec4.floatingWindow',
      })}
      // dragConstraints={{
      //   top: -50,
      //   left: -50,
      //   right: 50,
      //   bottom: 50,
      // }}
      style={{
        top: 100,
        left: 100,
        zIndex: 444,
      }}
    >
      <ViewDetailsCard />
      {
        /* <Group justify="space-between" mb="md">
        <Txt>Usage demo</Txt>
        <CloseButton onClick={() => closeWindow({ id })} />
      </Group>
      <Txt fontSize="sm">This is a floating window. You can drag it around.</Txt> */
      }
    </m.div>
  )
}
