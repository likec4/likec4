import { memo } from 'react'
import type { Types } from '../../types'

export const LifelineNode = memo(function LifelineNode(_props: Types.NodeProps<'seq-lifeline'>) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#9ca3af',
        opacity: 0.35,
        pointerEvents: 'none',
      }}
    />
  )
})
