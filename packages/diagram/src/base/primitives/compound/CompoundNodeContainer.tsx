import type { DiagramNode } from '@likec4/core'
import { type BoxProps, Box, createPolymorphicComponent } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { type PropsWithChildren, forwardRef } from 'react'
import { clamp, isNumber } from 'remeda'
import type { NodeProps } from '../../types'
import * as css from './CompoundNodeContainer.css'

type RequiredData = Pick<
  DiagramNode,
  | 'color'
  | 'depth'
  | 'shape'
  | 'style'
>

type CompoundNodeContainerProps =
  & BoxProps
  & PropsWithChildren<{
    nodeProps: NodeProps<RequiredData>
  }>

export const CompoundNodeContainer = createPolymorphicComponent<'div', CompoundNodeContainerProps>(
  forwardRef<HTMLDivElement, CompoundNodeContainerProps>(({
    nodeProps: {
      data: {
        hovered: isHovered = false,
        dimmed: isDimmed = false,
        style,
        ...data
      },
    },
    children,
    ...rest
  }, ref) => {
    const isTransparent = isNumber(style.opacity) && style.opacity < 100
    let opacity = clamp((style.opacity ?? 100) / 100, {
      min: 0,
      max: 1,
    })
    if (isTransparent && isHovered) {
      opacity = Math.min(opacity + 0.11, 1)
    }
    const MAX_TRANSPARENCY = 40
    const borderTransparency = clamp(MAX_TRANSPARENCY - opacity * MAX_TRANSPARENCY, {
      min: 0,
      max: MAX_TRANSPARENCY,
    })
    return (
      <Box
        ref={ref}
        component={m.div}
        className={clsx([
          css.container,
          'likec4-compound-node',
        ])}
        initial={false}
        data-hovered={isHovered}
        data-likec4-color={data.color}
        data-compound-depth={data.depth ?? 1}
        data-compound-transparent={isTransparent}
        data-likec4-dimmed={isDimmed}
        data-likec4-shape={data.shape}
        style={assignInlineVars({
          [css.varCompoundOpacity]: opacity.toFixed(2),
          [css.varBorderTransparency]: `${borderTransparency}%`,
        })}
        {...rest}
      >
        <svg className={css.indicator}>
          <rect
            x={0}
            y={0}
            width={'100%'}
            height={'100%'}
            rx={6}
          />
        </svg>
        <div className={css.compoundBg} />
        {isTransparent && style.border !== 'none' && (
          <div
            className={css.compoundBorder}
            style={{
              borderStyle: style.border ?? 'dashed',
            }}
          />
        )}
        {children}
      </Box>
    )
  }),
)
CompoundNodeContainer.displayName = 'CompoundNodeContainer'
