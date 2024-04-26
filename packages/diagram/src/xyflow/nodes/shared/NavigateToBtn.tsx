import { ActionIcon } from '@mantine/core'
import { useInternalNode, useNodesData } from '@xyflow/react'
import clsx from 'clsx'
import { ZoomIn } from '../../../icons'
import { useDiagramStoreApi } from '../../../store'
import type { XYFlowNode } from '../../types'

export type NavigateToBtnProps = {
  xynodeId: string
  className?: string
}

// // Frame-motion variants
// const variants = {
//   idle: {
//     transformOrigin: '50% 50%',
//     translateX: "-50%",
//     scale: 0.9,
//     backgroundColor: "var(--ai-bg)",
//     opacity: 0.8
//   },
//   hover: {
//     scale: 1.4,
//     translateX: "-50%",
//     opacity: 1,
//     backgroundColor: "var(--ai-bg-hover)",
//     // transition: {
//     //   delay: 0.1
//     // }
//   },
//   dragging: {
//     scale: 1,
//     translateX: "-50%",
//     opacity: 1,
//     backgroundColor: "var(--ai-bg)",
//     transition: {
//       type: 'spring'
//     }
//   }
// } satisfies Variants

export function NavigateToBtn({ xynodeId, className }: NavigateToBtnProps) {
  const diagramApi = useDiagramStoreApi()
  return (
    <ActionIcon
      className={clsx('nodrag nopan', className)}
      radius="xl"
      autoFocus={false}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        diagramApi.getState().triggerOnNavigateTo(xynodeId, event)
      }}
    >
      <ZoomIn />
    </ActionIcon>
  )
}
