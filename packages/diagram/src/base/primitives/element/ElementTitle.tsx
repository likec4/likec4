import type { ComputedNodeStyle, NodeId } from '@likec4/core'
import { type Color, type RichTextOrEmpty, ensureSizes } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { elementNodeData, elementNodeIcon as elementIconRecipe } from '@likec4/styles/recipes'
import { Text } from '@mantine/core'
import { isEmpty, isNumber, isTruthy } from 'remeda'
import { IconRenderer } from '../../../context/IconRenderer'
import { MarkdownBlock } from '../MarkdownBlock'

type RequiredData = {
  id: NodeId
  title: string
  technology?: string | null | undefined
  color: Color
  style: ComputedNodeStyle
  description?: RichTextOrEmpty
  icon?: string | null
}

type ElementTitleProps = {
  data: RequiredData
  iconSize?: number
}

export function ElementTitle({ data, iconSize }: ElementTitleProps) {
  const elementIcon = IconRenderer({
    element: data,
    className: elementIconRecipe(),
  })
  const classes = elementNodeData({
    hasIcon: isTruthy(elementIcon),
    hasDescription: !!data.description?.nonEmpty,
    hasTechnology: !isEmpty(data.technology ?? ''),
  })
  const { size } = ensureSizes(data.style)
  const isSm = size === 'sm'
  const isSmOrXs = isSm || size === 'xs'
  return (
    <Box
      className={cx(
        classes.root,
        'likec4-element',
      )}
      style={isNumber(iconSize)
        ? {
          // @ts-ignore
          ['--likec4-icon-size']: `${iconSize}px`,
        }
        : undefined}
    >
      {elementIcon}
      <Box className={cx(classes.textContainer, 'likec4-element-main-props')}>
        <Text
          component="div"
          className={cx(classes.title, 'likec4-element-title')}
          lineClamp={isSmOrXs ? 2 : 3}>
          {data.title}
        </Text>

        {data.technology && (
          <Text
            component="div"
            className={cx(classes.technology, 'likec4-element-technology')}>
            {data.technology}
          </Text>
        )}

        {data.description?.nonEmpty && (
          <MarkdownBlock
            className={cx(classes.description, 'likec4-element-description')}
            value={data.description}
            uselikec4palette
            hideIfEmpty
            // Workaround for lineClamp not working with nested TABLE elements (if markdown has tables)
            maxHeight={data.description.isMarkdown ? '8rem' : undefined}
            // textScale={0.95}
            lineClamp={isSmOrXs ? 3 : 5}
          />
        )}
      </Box>
    </Box>
  )
}
