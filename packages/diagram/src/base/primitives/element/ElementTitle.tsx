import { type DiagramNode } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import clsx from 'clsx'
import { isNumber, isTruthy } from 'remeda'
import { IconRenderer } from '../../../context/IconRenderer'
import { hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
import { getVarName } from '../../../utils/css'
import type { NodeProps } from '../../types'
import { nodeSizes } from './ElementNodeContainer'
import * as css from './ElementTitle.css'

type Data =
  & Pick<
    DiagramNode,
    | 'title'
    | 'technology'
    | 'description'
    | 'color'
    | 'style'
  >
  & {
    icon?: string | null
  }

type ElementTitleProps = NodeProps<Data> & {
  iconSize?: number
}

const varIconSize = getVarName(css.iconSize)

export function ElementTitle({ id, data, iconSize }: ElementTitleProps) {
  const elementIcon = IconRenderer({
    element: {
      id,
      title: data.title,
      icon: data.icon,
    },
    className: css.elementIcon,
  })
  const size = nodeSizes(data.style).size
  const isSm = size === 'sm'
  const isSmOrXs = isSm || size === 'xs'
  return (
    <Box
      className={clsx(
        css.elementDataContainer,
        isTruthy(elementIcon) && css.hasIcon,
        'likec4-element',
      )}
      style={{
        ...isNumber(iconSize) && {
          [varIconSize]: `${iconSize}px`,
        },
      }}
    >
      {elementIcon}
      <Box className={clsx(css.elementTextData, 'likec4-element-main-props')}>
        <Text
          component="h3"
          className={clsx(css.title, 'likec4-element-title')}
          lineClamp={isSmOrXs ? 2 : 3}>
          {data.title}
        </Text>

        {data.technology && (
          <Text
            component="div"
            className={clsx(css.technology, hiddenIfZoomTooSmall, 'likec4-element-technology')}>
            {data.technology}
          </Text>
        )}

        {data.description && (
          <Text
            component="div"
            className={clsx(css.description, 'likec4-element-description')}
            lineClamp={isSmOrXs ? 3 : 5}>
            {data.description}
          </Text>
        )}
      </Box>
    </Box>
  )
}
