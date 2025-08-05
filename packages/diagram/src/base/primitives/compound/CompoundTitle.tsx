import type { DiagramNode } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { Text } from '@mantine/core'
import { IconRenderer } from '../../../context'
import type { NodeProps } from '../../types'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'title'
  | 'icon'
  | 'style'
>

type CompoundTitleProps = NodeProps<Data>

const titleContainer = css({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '[6px]',
  left: '[14px]',
  top: '[4px]',
  right: '[30px]',
  width: 'auto',
  minHeight: '30px',
  [`:where(.react-flow__node.draggable) &`]: {
    pointerEvents: 'all',
    cursor: 'grab',
  },
  [`.likec4-compound-node:has(.compound-action) &`]: {
    paddingLeft: '[22px]',
  },
})

const titleText = css({
  flex: '1',
  fontFamily: 'likec4.compound',
  fontWeight: 600,
  fontSize: '15px',
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  color: 'likec4.palette.loContrast',
  '[data-compound-title-inverse] &': {
    color: {
      base: '[color-mix(in srgb, {colors.likec4.palette.loContrast} 60%, {colors.likec4.palette.fill})]',
      _light: 'likec4.palette.stroke',
    },
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
  mixBlendMode: {
    base: 'hard-light',
    _reduceGraphicsOnPan: 'normal',
  },
  [`& svg, & img`]: {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    pointerEvents: 'none',
    filter: {
      base: [
        'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
        'drop-shadow(0 1px 8px rgb(0 0 0 / 8%))',
        'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
      ],
      _reduceGraphicsOnPan: 'none',
    },
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
        titleContainer,
        'likec4-compound-title',
      )}>
      {elementIcon}
      <Text className={titleText} truncate="end">
        {data.title}
      </Text>
    </Box>
  )
}
