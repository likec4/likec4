import { type RichTextOrEmpty as RichTextType } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { type BoxProps, Box } from '@likec4/styles/jsx'
import { descriptionRichText } from '@likec4/styles/recipes'
import { forwardRef } from 'react'

export type DescriptionMarkdownProps = Omit<BoxProps, 'dangerouslySetInnerHTML' | 'children'> & {
  value: RichTextType
  /**
   * If true, the component will not render anything if the value is empty.
   */
  hideIfEmpty?: boolean
  /**
   * Text to show if the value is empty.
   * @default "no description"
   */
  emptyText?: string
}

export const DescriptionMarkdown = forwardRef<HTMLDivElement, DescriptionMarkdownProps>(({
  value,
  hideIfEmpty = false,
  emptyText = 'no description',
  className,
  ...props
}, ref) => {
  if (value.isEmpty && hideIfEmpty) {
    return null
  }
  const __html = value.isEmpty ? emptyText : value.html
  return (
    <Box
      ref={ref}
      {...props}
      className={cx(
        descriptionRichText(),
        className,
      )}
      dangerouslySetInnerHTML={{ __html }} />
  )
})
