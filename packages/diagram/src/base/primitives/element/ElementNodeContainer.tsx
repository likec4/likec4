import {
  type Color,
  type ElementShape,
  type ElementStyle,
  DefaultPaddingSize,
  DefaultShapeSize,
  DefaultTextSize,
} from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import type { LayoutProps } from 'motion/react'
import * as m from 'motion/react-m'
import { type CSSProperties, type ReactNode, forwardRef } from 'react'
import type { NodeProps } from '../../types'
import * as styles from './ElementNodeContainer.css'

export type RequiredData = {
  color: Color
  shape: ElementShape
  style?: ElementStyle
}

export type ElementNodeContainerProps =
  & {
    nodeProps: NodeProps<RequiredData>
    children?: ReactNode | undefined
    className?: string | undefined
    style?: CSSProperties | undefined
    [key: `data-${string}`]: string | undefined
  }
  & LayoutProps

export function nodeSizes({
  size,
  padding,
  textSize,
}: ElementStyle) {
  if (!size && !!textSize) {
    size = textSize
  }
  if (!textSize && !!size) {
    textSize = size
  }
  if (!padding && !!size) {
    padding = size
  }
  size ??= DefaultShapeSize
  textSize ??= DefaultTextSize
  padding ??= DefaultPaddingSize
  return {
    size,
    padding,
    textSize,
  }
}

/**
 * Top-level primitive to compose leaf nodes renderers.
 * This container provides the state via data-* attributes
 */
export const ElementNodeContainer = forwardRef<HTMLDivElement, ElementNodeContainerProps>(({
  nodeProps: {
    selected = false,
    selectable = false,
    data: {
      hovered: isHovered = false,
      dimmed: isDimmed = false,
      ...data
    },
  },
  className,
  style,
  children,
  ...rest
}, ref) => {
  let scale = 1
  switch (true) {
    case isHovered:
      scale = 1.05
      break
    case selected:
      scale = 1.02
      break
  }

  const {
    size,
    padding,
    textSize,
  } = nodeSizes(data.style ?? {})

  return (
    <m.div
      ref={ref}
      className={cx(
        css({
          likec4Palette: data.color,
        }),
        styles.container,
        'group',
        'likec4-element-node',
        className,
      )}
      initial={false}
      {...selectable && {
        animate: {
          scale,
        },
        whileTap: { scale: 0.98 },
      }}
      data-likec4-hovered={isHovered}
      data-likec4-color={data.color}
      data-likec4-shape={data.shape}
      data-likec4-shape-size={size}
      data-likec4-spacing={padding}
      data-likec4-text-size={textSize}
      {...(isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
      })}
      style={{
        ...style as any,
      }}
      {...rest}
    >
      {children}
    </m.div>
  )
})
ElementNodeContainer.displayName = 'ElementNodeContainer'
