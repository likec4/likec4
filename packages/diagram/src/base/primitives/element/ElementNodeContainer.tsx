import {
  type Color,
  type ElementShape,
  type ElementStyle,
  ensureSizes,
} from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import type { MotionNodeLayoutOptions } from 'motion/react'
import * as m from 'motion/react-m'
import { type CSSProperties, type ReactNode, forwardRef } from 'react'
import type { BaseNode, BaseNodeProps, BaseNodePropsWithData } from '../../types'
import * as styles from './ElementNodeContainer.css'

export type RequiredData = {
  color: Color
  shape: ElementShape
  style?: ElementStyle
}

export type ElementNodeContainerProps =
  & {
    nodeProps: BaseNodePropsWithData<RequiredData>
    children?: ReactNode | undefined
    className?: string | undefined
    style?: CSSProperties | undefined
    [key: `data-${string}`]: string | undefined
  }
  & MotionNodeLayoutOptions
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
  } = ensureSizes(data.style ?? {})

  return (
    <m.div
      ref={ref}
      className={cx(
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
