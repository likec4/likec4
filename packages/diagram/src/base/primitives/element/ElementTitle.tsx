import type { DiagramNode } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import clsx from 'clsx'
import { isTruthy } from 'remeda'
import { IconRenderer } from '../../context/IconRenderer'
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

type ElementTitleProps = NodeProps<Data>

export function ElementTitle({ id, data }: ElementTitleProps) {
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
    >
      {elementIcon}
      <Box className={clsx(css.elementTextData, 'likec4-element-main-props')}>
        <Text
          component="h3"
          className={clsx(css.title, 'likec4-element-title')}>
          {data.title}
        </Text>

        {data.technology && (
          <Text
            component="div"
            className={clsx(css.technology, 'likec4-element-technology')}>
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
