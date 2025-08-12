import type { Color, ElementStyle } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { compoundNode } from '@likec4/styles/recipes'
import { type HTMLMotionProps, m } from 'motion/react'
import { type PropsWithChildren } from 'react'
import { clamp } from 'remeda'
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
  let opacity = clamp(data.style.opacity ?? 100, {
    min: 0,
    max: 100,
  })
  const isTransparent = opacity < 99

  const MIN_OPACITY = 65
  const borderOpacity = MIN_OPACITY + clamp((100 - MIN_OPACITY) * (opacity / 100), {
    min: 0,
    max: 100 - MIN_OPACITY,
  })

  const compoundClass = compoundNode({
    isTransparent,
    inverseColor: opacity < 60,
    borderStyle: data.style.border ?? (isTransparent ? 'dashed' : 'none'),
  })

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
      style={{
        ...style,
        // @ts-expect-error
        ['--_border-transparency']: `${borderOpacity}%`,
        ['--_compound-transparency']: `${opacity}%`,
      }}
      {...rest}
    >
      {children}
    </m.div>
  )
}
