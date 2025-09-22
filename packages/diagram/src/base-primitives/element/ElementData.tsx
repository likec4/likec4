import type { ComputedNodeStyle, NodeId } from '@likec4/core'
import { type Color, type RichTextOrEmpty, ensureSizes } from '@likec4/core/types'
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
import { isNumber, isTruthy } from 'remeda'
import type { MergeExclusive } from 'type-fest'
import { IconRenderer } from '../../context/IconRenderer'
import { Markdown } from '../Markdown'

type RequiredData = {
  id: NodeId
  title: string
  technology?: string | null | undefined
  color: Color
  style: ComputedNodeStyle
  description?: RichTextOrEmpty
  icon?: string | null
}

type ElementDataProps = {
  data: RequiredData
  iconSize?: number
}

const Root = forwardRef<HTMLDivElement, DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>((
  { className, ...props },
  ref,
) => (
  <div
    {...props}
    ref={ref}
    className={cx(
      className,
      elementNodeData(),
      'likec4-element',
    )}
  />
))

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
  { data: { description, style }, className, ...props },
  ref,
) => {
  if (!description?.nonEmpty) {
    return null
  }
  const { size } = ensureSizes(style)
  const isSm = size === 'sm' || size === 'xs'
  return (
    <Markdown
      {...props}
      className={cx(
        className,
        'likec4-element-description',
      )}
      data-likec4-node-description=""
      value={description}
      uselikec4palette
      hideIfEmpty
      // Workaround for lineClamp not working with nested TABLE elements (if markdown has tables)
      maxHeight={description.isMarkdown ? '8rem   ' : undefined}
      // textScale={0.95}
      lineClamp={isSm ? 3 : 5}
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
 * <ElementData.Root>
 *   <ElementData.Icon {...nodeProps} />
 *   <ElementData.Root>
 *     <ElementData.Title {...nodeProps} />
 *     <ElementData.Technology {...nodeProps} />
 *     <ElementData.Description {...nodeProps} />
 *   </ElementData.Root>
 * </ElementData.Root>
 * ```
 */
export function ElementData({ iconSize, data }: ElementDataProps) {
  return (
    <Root
      style={isNumber(iconSize)
        ? {
          // @ts-ignore
          ['--likec4-icon-size']: `${iconSize}px`,
        }
        : undefined}
    >
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
