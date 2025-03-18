import type { DiagramNode } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { Box, Text } from '@mantine/core'
import { IconRenderer } from '../../../context'
import type { NodeProps } from '../../types'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'title'
  | 'icon'
>

type CompoundTitleProps = NodeProps<Data>

const cssCompoundTitle = css({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  left: '14px',
  top: '4px',
  right: '30px',
  width: 'auto',
  minHeight: '30px',
  _smallZoom: {
    visibility: 'hidden',
  },
  [`:where(.react-flow__node.draggable) &`]: {
    cursor: 'grab',
  },
  [`.likec4-compound-node:has(.compound-action) &`]: {
    paddingLeft: '22px',
  },
})

const cssTitle = css({
  flex: '1',
  fontFamily: 'likec4.compound',
  fontWeight: 600,
  fontSize: '15px',
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  color: '[var(--_compound-title-color, {colors.likec4.compound.title})]',
  _light: {
    _compoundTransparent: {
      color: 'likec4.element.stroke',
    },
  },
  _notReducedGraphics: {
    mixBlendMode: 'screen',
  },
})

const iconSize = '20px'
const cssIcon = css({
  flex: `0 0 ${iconSize}`,
  height: `${iconSize}`,
  width: `${iconSize}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'hard-light',
  [`& svg, & img`]: {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    pointerEvents: 'none',
    filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 12%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 8%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))
  `,
  },
  [`& img`]: {
    objectFit: 'contain',
  },
})

export function CompoundTitle({ id, data }: CompoundTitleProps) {
  const elementIcon = IconRenderer({
    element: {
      id,
      title: data.title,
      icon: data.icon,
    },
    className: cssIcon,
  })

  return (
    <Box
      className={cx(
        cssCompoundTitle,
        'likec4-compound-title',
      )}>
      {elementIcon}
      <Text className={cssTitle} truncate="end">
        {data.title}
      </Text>
    </Box>
  )
}
