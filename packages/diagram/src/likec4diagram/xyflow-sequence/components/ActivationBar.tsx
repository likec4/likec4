import { css } from '@likec4/styles/css'
import { memo } from 'react'
import type { Types } from '../../types'

const barCss = css({
  width: '100%',
  height: '100%',
  rounded: 'xs',
  borderWidth: '1px',
  borderStyle: 'solid',
})

export const ActivationBar = memo(function ActivationBar(props: Types.NodeProps<'seq-activation'>) {
  const { data } = props
  const { depth } = data

  return (
    <div
      className={barCss}
      data-activation-depth={depth}
      style={{
        backgroundColor: '#60a5fa',
        borderColor: '#2563eb',
        opacity: depth > 0 ? 0.85 : 0.7,
        boxShadow: depth > 0 ? '0 2px 6px rgba(0,0,0,0.25)' : undefined,
      }}
    />
  )
})
