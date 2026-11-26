import { type RichTextOrEmpty as RichTextType, isRichText } from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { markdownBlock } from '@likec4/styles/recipes'
import type { Tokens } from '@likec4/styles/tokens'
import { Text } from '@mantine/core'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
} from 'react'

export type MarkdownProps =
  & Omit<ComponentPropsWithoutRef<'div'>, 'dangerouslySetInnerHTML' | 'children' | 'color' | 'translate'>
  & {
    value: RichTextType | { html: string }

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
    fontSize?: Tokens['fontSizes'] | undefined

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
  if (isRichText(value) && value.isEmpty && hideIfEmpty) {
    return null
  }

  // We received html directly, so we assume it's markdown
  const isMarkdown = !isRichText(value) || (value.nonEmpty && value.isMarkdown)

  let content
  switch (true) {
    case isMarkdown:
      content = { dangerouslySetInnerHTML: { __html: nonNullable(value.html, 'Markdown html is required') } }
      break
    case isRichText(value) && value.nonEmpty:
      content = { children: <p>{value.text}</p> }
      break
    default:
      content = {
        children: <Text component="span" fz={'xs'} c="dimmed" style={{ userSelect: 'none' }}>{emptyText}</Text>,
      }
      break
  }

  return (
    <Box
      {...props}
      ref={ref}
      className={cx(
        markdownBlock({
          uselikec4palette,
          value: isMarkdown ? 'markdown' : 'plaintext',
        }),
        className,
      )}
      style={{
        ...style,
        ...(fontSize && {
          '--text-fz': `var(--font-sizes-${fontSize}, var(--font-sizes-md))`,
        }),
        ...(textScale !== 1 && {
          ['--mantine-scale']: textScale,
        }),
      }}
      {...content}
    />
  )
})
Markdown.displayName = 'Markdown'
