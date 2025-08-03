import { type RichTextOrEmpty as RichTextType } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { type BoxProps, Box } from '@likec4/styles/jsx'
import { markdownBlock } from '@likec4/styles/recipes'
import { Text } from '@mantine/core'
import { forwardRef } from 'react'

export type MarkdownBlockProps = Omit<BoxProps, 'dangerouslySetInnerHTML' | 'children'> & {
  value: RichTextType

  /**
   * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
   * @default false
   */
  uselikec4palette?: boolean
  /**
   * Scale factor for the font size.
   * @default 1
   */
  textScale?: number
  /**
   * If true, the component will not render anything if the value is empty.
   * @default false
   */
  hideIfEmpty?: boolean
  /**
   * Text to show if the value is empty.
   * @default "no content"
   */
  emptyText?: string
}

export const MarkdownBlock = forwardRef<HTMLDivElement, MarkdownBlockProps>(({
  value,
  textScale = 1,
  uselikec4palette = false,
  hideIfEmpty = false,
  emptyText = 'no content',
  className,
  ...props
}, ref) => {
  if (value.isEmpty && hideIfEmpty) {
    return null
  }
  const content = value.nonEmpty
    ? { dangerouslySetInnerHTML: { __html: value.html } }
    : { children: <Text component="span" fz={'xs'} c="dimmed" style={{ userSelect: 'none' }}>{emptyText}</Text> }
  return (
    <Box
      ref={ref}
      {...props}
      className={cx(
        markdownBlock({
          uselikec4palette,
        }),
        className,
      )}
      style={{
        // @ts-expect-error
        ['--mantine-scale']: textScale,
      }}
      {...content}
    />
  )
})
MarkdownBlock.displayName = 'MarkdownBlock'
