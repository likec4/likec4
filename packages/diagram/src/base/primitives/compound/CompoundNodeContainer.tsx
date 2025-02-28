import type { DiagramNode } from '@likec4/core'
import { type BoxProps, Box, createPolymorphicComponent } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { type PropsWithChildren, forwardRef } from 'react'
import { clamp, isNumber } from 'remeda'
import { useIsReducedGraphics } from '../../../hooks/useIsReducedGraphics'
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

function getVarName(variable: string): string {
  var matches = variable.match(/^var\((.*)\)$/)
  if (matches) {
    return matches[1]!
  }
  return variable
}

const opacityVar = getVarName(css.varCompoundOpacity)
const borderTransparencyVar = getVarName(css.varBorderTransparency)

export const CompoundNodeContainer = createPolymorphicComponent<'div', CompoundNodeContainerProps>(
  forwardRef<HTMLDivElement, CompoundNodeContainerProps>(({
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
  }, ref) => {
    const isReducedGraphics = useIsReducedGraphics()
    const isTransparent = isNumber(data.style.opacity) && data.style.opacity < 100
    let _opacity = clamp((data.style.opacity ?? 100) / 100, {
      min: 0,
      max: 1,
    })
    if (isTransparent && isHovered && !isReducedGraphics) {
      _opacity = Math.min(_opacity + 0.11, 1)
    }

    const [opacity] = useDebouncedValue(Math.round(_opacity * 100) / 100, isHovered ? 200 : 50)

    const MAX_TRANSPARENCY = 65
    const borderTransparency = clamp(MAX_TRANSPARENCY - 0.8 * opacity * MAX_TRANSPARENCY, {
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
        style={{
          ...style,
          [opacityVar]: opacity,
          [borderTransparencyVar]: `${borderTransparency}%`,
        }}
        {...rest}
      >
        {isTransparent && !isSelected && data.style.border !== 'none' && (
          <div
            className={css.compoundBorder}
            style={{
              borderStyle: data.style.border ?? 'dashed',
            }}
          />
        )}
        {isSelected && (
          <svg className={css.indicator}>
            <rect
              x={0}
              y={0}
              width={'100%'}
              height={'100%'}
              rx={6}
            />
          </svg>
        )}
        {children}
      </Box>
    )
  }),
)
CompoundNodeContainer.displayName = 'CompoundNodeContainer'
