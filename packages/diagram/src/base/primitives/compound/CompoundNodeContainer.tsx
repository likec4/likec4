import type { DiagramNode } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type HTMLMotionProps, m } from 'motion/react'
import { type PropsWithChildren } from 'react'
import { clamp, isNumber } from 'remeda'
import { useIsReducedGraphics } from '../../../hooks/useReducedGraphics'
import type { NodeProps } from '../../types'
import * as styles from './CompoundNodeContainer.css'

type RequiredData = Pick<
  DiagramNode,
  | 'color'
  | 'depth'
  | 'style'
>

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
  children,
  style,
  ...rest
}: CompoundNodeContainerProps) {
  const isReducedGraphics = useIsReducedGraphics()
  const isTransparent = isNumber(data.style.opacity) && data.style.opacity < 99
  let opacity = clamp((data.style.opacity ?? 100) / 100, {
    min: 0,
    max: 1,
  })
  if (isTransparent && isHovered && !isReducedGraphics) {
    opacity = Math.min(opacity + 0.08, 1)
  }

  // const [opacity] = useDebouncedValue(Math.round(_opacity * 100) / 100, isHovered ? 200 : 50)

  const MIN_OPACITY = 65
  const borderOpacity = MIN_OPACITY + clamp((100 - MIN_OPACITY) * opacity, {
    min: 0,
    max: 100 - MIN_OPACITY,
  })

  const classes = styles.compound({
    isTransparent,
  })
  const depth = clamp(data.depth ?? 1, {
    min: 1,
    max: 5,
  })

  return (
    <m.div
      className={cx(
        css({
          likec4Palette: `${data.color}.${depth}`,
        }),
        classes.root,
        'likec4-compound-node',
      )}
      initial={false}
      data-likec4-hovered={isHovered}
      data-likec4-color={data.color}
      data-compound-depth={depth}
      {...isTransparent && {
        'data-compound-transparent': true,
        'data-compound-title-inverse': opacity < 0.5,
      }}
      {...isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
      }}
      style={{
        ...style,
        // @ts-expect-error
        [styles.compoundOpacity.var]: opacity,
        [styles.borderWidth.var]: `3px`,
        [styles.borderRadius.var]: `6px`,
        [styles.borderOpacityPercent.var]: `${borderOpacity}%`,
      }}
      {...rest}
    >
      {isTransparent && data.style.border !== 'none' && (
        <div
          className={classes.compoundBorder}
          style={{
            borderStyle: data.style.border ?? 'dashed',
          }}
        />
      )}
      <svg className={classes.indicatorSvg}>
        <rect
          className={classes.indicatorRect}
          x={0}
          y={0}
          width={'100%'}
          height={'100%'}
          rx={6}
        />
      </svg>
      {children}
    </m.div>
  )
}
