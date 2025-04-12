import { type DiagramEdge, invariant } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type PropsWithChildren } from 'react'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { EdgeProps } from '../../types'
import * as styles from './edge.css'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'dir'
    | 'color'
  >
>

type EdgeContainerProps = PropsWithChildren<
  EdgeProps<Data> & {
    component?: 'g' | 'svg' | undefined
    className?: string | undefined
  }
>

// export
//
export function EdgeContainer({
  className,
  component = 'g',
  data: {
    color = 'gray',
    hovered: isHovered = false,
    active: isActive = false,
    dimmed: isDimmed = false,
    ...data
  },
  children,
  style,
}: EdgeContainerProps) {
  const props = {
    className: cx(
      css({
        likec4RelationPalette: color,
      }),
      styles.edgeVars,
      styles.edgeContainer,
      className,
    ),
    'data-likec4-color': color,
    'data-edge-dir': data.dir ?? 'forward',
    'data-edge-active': isActive,
    'data-edge-animated': isActive,
    'data-likec4-hovered': isHovered,
    ...(isDimmed !== false && {
      'data-likec4-dimmed': isDimmed,
    }),
  }
  if (component === 'svg') {
    return (
      <svg style={style} {...props}>
        {children}
      </svg>
    )
  }
  invariant(component === 'g', 'EdgeContainer: component must be "g" or "svg"')

  return (
    <g style={style} {...props}>
      {children}
    </g>
  )
}
