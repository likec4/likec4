import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import * as m from 'motion/react-m'
import { DefaultHandles } from '../../../base-primitives'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

const circle = css({
  flexShrink: 0,
  width: '[100%]',
  height: '[100%]',
  borderRadius: '[50%]',
  backgroundColor: 'var(--likec4-palette-fill)',
  border: '2px solid var(--likec4-palette-stroke)',
})

const label = css({
  position: 'absolute',
  left: '[calc(100% + 6px)]',
  top: '[50%]',
  translate: 'auto',
  translateY: '-1/2',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  fontSize: 'xs',
  lineHeight: '1.2',
  color: '[var(--likec4-palette-hiContrast)]',
})

/**
 * Renders an element as a compact circle, used in the "graph" display variant of element views.
 */
export function GraphElementNode(props: Types.NodeProps<'graph-element'>) {
  const diagram = useDiagram()
  const { data, selected } = props

  return (
    <m.div
      data-likec4-color={data.color}
      className={css({
        position: 'relative',
        width: '[100%]',
        height: '[100%]',
        cursor: data.navigateTo ? 'pointer' : 'default',
      })}
      initial={false}
      animate={{ scale: selected || data.hovered ? 1.2 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onDoubleClick={e => {
        if (!data.navigateTo) return
        e.stopPropagation()
        diagram.navigateTo(data.navigateTo)
      }}
    >
      <Box className={circle} />
      <Box className={label}>
        <span className={css({ fontWeight: 'medium' })}>{data.title}</span>
        {data.technology && <span className={css({ opacity: 0.7, fontSize: 'xxs' })}>[{data.technology}]</span>}
      </Box>
      <DefaultHandles />
    </m.div>
  )
}
