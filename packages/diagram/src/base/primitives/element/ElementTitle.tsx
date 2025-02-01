import type { DiagramNode } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import { isNumber, isTruthy } from 'remeda'
import { IconRenderer } from '../../../context/IconRenderer'
import { hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
import type { NodeProps } from '../../types'
import * as css from './ElementTitle.css'

type Data =
  & Pick<
    DiagramNode,
    | 'title'
    | 'technology'
    | 'description'
    | 'color'
  >
  & {
    icon?: string | null
  }

type ElementTitleProps = NodeProps<Data> & {
  iconSize?: number
}

export function ElementTitle({ id, data, iconSize }: ElementTitleProps) {
  const elementIcon = IconRenderer({
    element: {
      id,
      title: data.title,
      icon: data.icon,
    },
    className: css.elementIcon,
  })
  return (
    <Box
      className={clsx(
        css.elementDataContainer,
        isTruthy(elementIcon) && css.hasIcon,
        'likec4-element',
      )}
      style={{
        ...isNumber(iconSize) && assignInlineVars({
          [css.iconSize]: `${iconSize}px`,
        }),
      }}
    >
      {elementIcon}
      <Box className={clsx(css.elementTextData, 'likec4-element-main-props')}>
        <Text
          component="h3"
          className={clsx(css.title, 'likec4-element-title')}
          lineClamp={3}>
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
            lineClamp={5}>
            {data.description}
          </Text>
        )}
      </Box>
    </Box>
  )
}
