import type { Color, ElementStyle } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { compoundNode } from '@likec4/styles/recipes'
import { type HTMLMotionProps, m } from 'motion/react'
import { type PropsWithChildren } from 'react'
import { clamp } from 'remeda'
import { useIsReducedGraphics } from '../../../hooks/useReducedGraphics'
import type { NodeProps } from '../../types'
// import * as styles from './CompoundNodeContainer.css'

export type RequiredData = {
  color: Color
  depth: number
  style: ElementStyle
}

type CompoundNodeContainerProps =
  & Omit<HTMLMotionProps<'div'>, 'children'>
  & PropsWithChildren<{
    nodeProps: NodeProps<RequiredData>
  }>

export function CompoundNodeContainer({
  nodeProps: {
    selected: isSelected = false,
    data: {
      hovered: isHovered = false,
      dimmed: isDimmed = false,
      ...data
    },
  },
  className,
  children,
  style,
  ...rest
}: CompoundNodeContainerProps) {
  const isReducedGraphics = useIsReducedGraphics()

  let opacity = clamp(data.style.opacity ?? 100, {
    min: 0,
    max: 100,
  })
  const borderOpacity = 50 + opacity * 0.5
  const isTransparent = opacity < 99

  const compoundClass = compoundNode({
    isTransparent,
    inverseColor: opacity < 65,
    borderStyle: data.style.border ?? (isTransparent ? 'dashed' : 'none'),
  })

  if (isTransparent && isHovered && !isReducedGraphics) {
    opacity = Math.min(opacity + 7, 100)
  }

  const depth = clamp(data.depth ?? 1, {
    min: 1,
    max: 5,
  })

  return (
    <m.div
      className={cx(
        compoundClass,
        className,
      )}
      initial={false}
      data-likec4-hovered={isHovered}
      data-likec4-color={data.color}
      data-compound-depth={depth}
      {...isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
      }}
      {...isTransparent && {
        'data-compound-transparent': true,
        animate: {
          ['--_compound-transparency']: `${opacity}%`,
          transition: {
            delay: isHovered ? 0.17 : 0,
          },
        },
      }}
      style={{
        ...style,
        // @ts-expect-error
        ['--_border-transparency']: `${borderOpacity}%`,
      }}
      {...rest}
    >
      {children}
    </m.div>
  )
}
