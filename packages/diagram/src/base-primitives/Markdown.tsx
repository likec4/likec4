import type { RichTextOrEmpty as RichTextType } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { type BoxProps, Box } from '@likec4/styles/jsx'
import { markdownBlock } from '@likec4/styles/recipes'
import type { JsxStyleProps } from '@likec4/styles/types'
import { Text } from '@mantine/core'
import { forwardRef } from 'react'

export type MarkdownProps = Omit<BoxProps, 'dangerouslySetInnerHTML' | 'children'> & {
  value: RichTextType

  /**
   * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
   * @default false
   */
  uselikec4palette?: boolean
  /**
   * Scale factor for the block
   * @default 1
   */
  textScale?: number

  /**
   * Font size for the block
   * @default 'md'
   */
  fontSize?: (JsxStyleProps['fontSize'] & string) | undefined

  /**
   * If true, the component will not render anything if the value is empty.
   * @default false
   */
  hideIfEmpty?: boolean | undefined
  /**
   * Text to show if the value is empty.
   * @default "no content"
   */
  emptyText?: string
}

export const Markdown = forwardRef<HTMLDivElement, MarkdownProps>(({
  value,
  textScale = 1,
  uselikec4palette = false,
  hideIfEmpty = false,
  emptyText = 'no content',
  className,
  style,
  fontSize,
  ...props
}, ref) => {
  if (value.isEmpty && hideIfEmpty) {
    return null
  }
  const content = value.nonEmpty
    ? value.isMarkdown
      ? { dangerouslySetInnerHTML: { __html: value.html } }
      : { children: <p>{value.text}</p> }
    : { children: <Text component="span" fz={'xs'} c="dimmed" style={{ userSelect: 'none' }}>{emptyText}</Text> }
  return (
    <Box
      ref={ref}
      {...props}
      className={cx(
        markdownBlock({
          uselikec4palette,
          value: value.isMarkdown ? 'markdown' : 'plaintext',
        }),
        className,
      )}
      style={{
        ...style,
        ...(fontSize && {
          '--text-fz': `var(--font-sizes-${fontSize}, var(--font-sizes-md))`,
        }),
        // @ts-expect-error
        ['--mantine-scale']: textScale,
      }}
      {...content}
    />
  )
})
Markdown.displayName = 'Markdown'
