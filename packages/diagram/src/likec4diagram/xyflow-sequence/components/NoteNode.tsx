import { css, cx } from '@likec4/styles/css'
import { memo } from 'react'
import type { Types } from '../../types'

type NotePlacement = 'over' | 'left' | 'right'

const containerBaseCss = css({
  width: '100%',
  height: '100%',
  padding: '2',
  fontSize: 'xs',
  lineHeight: '1.4',
  borderRadius: 'xs',
  wordBreak: 'break-word',
  userSelect: 'none',
  borderWidth: '1px',
  borderStyle: 'solid',
  boxShadow: 'sm',
})

const placementCss: Record<NotePlacement, string> = {
  over: css({ textAlign: 'center' }),
  left: css({ textAlign: 'right' }),
  right: css({ textAlign: 'left' }),
}

export const NoteNode = memo(function NoteNode(props: Types.NodeProps<'seq-note'>) {
  const { data } = props
  const { placement, text } = data

  return (
    <div
      className={cx(containerBaseCss, placementCss[placement])}
      data-note-placement={placement}
      style={{
        backgroundColor: '#fef9c3',
        borderColor: '#fde047',
        color: '#1f2937',
      }}
    >
      {text}
    </div>
  )
})
