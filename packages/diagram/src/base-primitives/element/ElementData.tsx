import type { ComputedNodeStyle, MarkdownOrString, NodeId } from '@likec4/core'
import { type Color, ensureSizes, RichText } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { elementNodeData } from '@likec4/styles/recipes'
import { Text } from '@mantine/core'
import {
  type CSSProperties,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type PropsWithChildren,
  forwardRef,
} from 'react'
import { isTruthy } from 'remeda'
import type { MergeExclusive } from 'type-fest'
import { IconRenderer } from '../../context/IconRenderer'
import { useLikeC4Styles } from '../../hooks/useLikeC4Styles'
import { Markdown } from '../Markdown'

type RequiredData = {
  id: NodeId
  title: string
  technology?: string | null | undefined
  color: Color
  style: ComputedNodeStyle
  description?: MarkdownOrString | null | undefined
  icon?: string | null
}

export type ElementDataProps = {
  data: RequiredData
}

type RootProps = HTMLAttributes<HTMLDivElement> & ElementDataProps

const Root = forwardRef<
  HTMLDivElement,
  RootProps
>((
  {
    className,
    style,
    data,
    ...props
  },
  ref,
) => {
  const styles = useLikeC4Styles()
  const iconSize = data.style.iconSize
    ? styles.nodeSizes(data.style).values.iconSize
    : undefined
  const resolvedIconColor = data.style.iconColor
    ? styles.colors(data.style.iconColor).elements.hiContrast
    : undefined
  return (
    <div
      {...props}
      ref={ref}
      className={cx(
        className,
        elementNodeData({
          iconPosition: data.style.iconPosition,
        }),
        'likec4-element',
      )}
      style={{
        ...style,
        ...(iconSize && {
          // @ts-ignore
          '--likec4-icon-size': `${iconSize}px`,
        }),
        ...(resolvedIconColor && {
          // @ts-ignore
          '--likec4-icon-color': resolvedIconColor,
        }),
      }}
    />
  )
})

type IconProps = {
  data: {
    id: string
    title: string
    icon?: string | null | undefined
  }
  className?: string
  style?: CSSProperties
}

const Icon = ({ data, ...props }: IconProps) => <IconRenderer element={data} {...props} />

const Content = forwardRef<HTMLDivElement, DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>((
  { className, ...props },
  ref,
) => (
  <div
    {...props}
    className={cx(
      className,
      'likec4-element-node-content',
    )}
    ref={ref}
  />
))

type SlotProps = {
  data: RequiredData
  className?: string
  style?: CSSProperties
}

const Title = forwardRef<HTMLDivElement, SlotProps>((
  { data: { title, style }, className, ...props },
  ref,
) => {
  const { size } = ensureSizes(style)
  const isSm = size === 'sm' || size === 'xs'
  return (
    <Text
      component="div"
      {...props}
      className={cx(
        className,
        'likec4-element-title',
      )}
      data-likec4-node-title=""
      lineClamp={isSm ? 2 : 3}
      ref={ref}
    >
      {title}
    </Text>
  )
})

const Technology = forwardRef<HTMLDivElement, MergeExclusive<SlotProps, PropsWithChildren>>((
  { data, children, className, ...props },
  ref,
) => {
  const text = data?.technology ?? children
  return isTruthy(text)
    ? (
      <Text
        component="div"
        {...props}
        className={cx(
          className,
          'likec4-element-technology',
        )}
        data-likec4-node-technology=""
        ref={ref}
      >
        {text}
      </Text>
    )
    : null
})

const Description = forwardRef<
  HTMLDivElement,
  SlotProps
>((
  { data: { description }, className, ...props },
  ref,
) => {
  if (!description) {
    return null
  }
  const desc = RichText.from(description)
  return (
    <Markdown
      {...props}
      className={cx(
        className,
        'likec4-element-description',
      )}
      data-likec4-node-description=""
      value={desc}
      uselikec4palette
      hideIfEmpty
      style={{
        // Workaround for lineClamp not working with nested TABLE elements (if markdown has tables)
        maxHeight: desc.isMarkdown ? '8rem' : undefined,
      }}
      ref={ref}
    />
  )
})

/**
 * Renders an element title, technology, description, and icon.
 *
 * @example
 * ```tsx
 * <ElementData {...nodeProps} />
 * ```
 * or
 * ```tsx
 * <ElementData.Root {...nodeProps} >
 *   <ElementData.Icon {...nodeProps} />
 *   <ElementData.Content>
 *     <ElementData.Title {...nodeProps} />
 *     <ElementData.Technology {...nodeProps} />
 *     <ElementData.Description {...nodeProps} />
 *   </ElementData.Content>
 * </ElementData.Root>
 * ```
 */
export function ElementData({ data }: ElementDataProps) {
  return (
    <Root data={data}>
      <Icon data={data} />
      <Content>
        <Title data={data} />
        <Technology data={data} />
        <Description data={data} />
      </Content>
    </Root>
  )
}
ElementData.Root = Root
ElementData.Icon = Icon
ElementData.Content = Content
ElementData.Title = Title
ElementData.Technology = Technology
ElementData.Description = Description
