import type { DiagramNode } from '@likec4/core'
import { cx } from '@likec4/styles/css'
import { type BoxProps, Box, createPolymorphicComponent } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { m } from 'framer-motion'
import { type PropsWithChildren, forwardRef } from 'react'
import { clamp, isNumber } from 'remeda'
import { useIsReducedGraphics } from '../../../hooks/useReducedGraphics'
import type { NodeProps } from '../../types'
import * as styles from './CompoundNodeContainer.css'

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

const indicator = styles.indicator()

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
      _opacity = Math.min(_opacity + 0.08, 1)
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
        className={cx(
          styles.container,
          // css({
          //   _before: {
          //     content: '""',
          //   },
          // }),
          'likec4-compound-node',
        )}
        initial={false}
        data-likec4-hovered={isHovered}
        data-likec4-color={data.color}
        data-compound-depth={data.depth ?? 1}
        data-compound-transparent={isTransparent}
        data-likec4-dimmed={isDimmed}
        data-likec4-shape={data.shape}
        style={{
          ...style,
          [styles._compoundOpacity]: opacity,
          [styles._borderWidth]: `3px`,
          [styles._borderRadius]: `6px`,
          [styles._borderTransparency]: `${borderTransparency}%`,
        }}
        {...rest}
      >
        {isTransparent && !isSelected && data.style.border !== 'none' && (
          <div
            className={styles.compoundBorder}
            style={{
              borderStyle: data.style.border ?? 'dashed',
            }}
          />
        )}
        {isSelected && (
          <svg className={indicator.root}>
            <rect
              className={indicator.rect}
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
