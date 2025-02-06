import { type DiagramNode, DefaultPaddingSize, DefaultShapeSize, DefaultTextSize } from '@likec4/core'
import { type BoxProps, Box, createPolymorphicComponent } from '@mantine/core'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { type PropsWithChildren, forwardRef } from 'react'
import type { NodeProps } from '../../types'
import * as css from './ElementNodeContainer.css'

type RequiredData = Pick<
  DiagramNode,
  | 'color'
  | 'shape'
  | 'style'
>

type ElementNodeContainerProps =
  & BoxProps
  & PropsWithChildren<{
    nodeProps: NodeProps<RequiredData>
  }>

export const ElementNodeContainer = createPolymorphicComponent<'div', ElementNodeContainerProps>(
  forwardRef<HTMLDivElement, ElementNodeContainerProps>(({
    nodeProps: {
      selected = false,
      selectable = false,
      data: {
        hovered: isHovered = false,
        dimmed: isDimmed = false,
        ...data
      },
    },
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

    let {
      size,
      padding,
      textSize,
    } = data.style

    // if (size === DefaultShapeSize && textSize !== DefaultTextSize) {
    //   size = textSize
    // }
    if (!size && !!textSize) {
      size = textSize
    }
    if (!textSize && !!size) {
      textSize = size
    }

    return (
      <Box
        component={m.div}
        ref={ref}
        className={clsx([
          css.container,
          'likec4-element-node',
        ])}
        initial={false}
        {...selectable && {
          animate: {
            scale,
          },
          whileTap: { scale: 0.98 },
        }}
        data-hovered={isHovered}
        data-likec4-color={data.color}
        data-likec4-shape={data.shape}
        data-likec4-shape-size={size ?? DefaultShapeSize}
        data-likec4-padding={padding ?? DefaultPaddingSize}
        data-likec4-text-size={textSize ?? DefaultTextSize}
        data-likec4-dimmed={isDimmed}
        {...rest}
      >
        {children}
      </Box>
    )
  }),
)
ElementNodeContainer.displayName = 'ElementNodeContainer'
