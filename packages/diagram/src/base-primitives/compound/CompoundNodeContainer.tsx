import type { Color, ElementStyle } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { compoundNode } from '@likec4/styles/recipes'
import * as m from 'motion/react-m'
import type { HTMLAttributes, PropsWithChildren } from 'react'
import { clamp } from 'remeda'
import type { BaseNode, BaseNodeProps } from '../../base/types'

export type RequiredData = {
  color: Color
  depth: number
  style: ElementStyle
}

type CompoundNodeContainerProps = // & Omit<HTMLMotionProps<'div'>, 'children'>
  PropsWithChildren<
    HTMLAttributes<HTMLDivElement> & {
      layout?: boolean | 'position' | 'size' | 'preserve-aspect'
      layoutId?: string | undefined // from motion
      nodeProps: BaseNodeProps<BaseNode<RequiredData>>
    }
  >

export function CompoundNodeContainer({
  nodeProps: {
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
      tabIndex={-1}
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
