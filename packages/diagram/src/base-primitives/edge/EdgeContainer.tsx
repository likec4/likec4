import { invariant } from '@likec4/core'
import type { DiagramEdge } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import type { PropsWithChildren } from 'react'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { BaseEdgePropsWithData } from '../../base/types'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'dir'
    | 'color'
  >
>

type EdgeContainerProps = PropsWithChildren<
  BaseEdgePropsWithData<Data> & {
    component?: 'g' | 'svg' | undefined
    className?: string | undefined
  }
>

// export
//
export function EdgeContainer({
  className,
  component = 'g',
  selectable = false,
  selected = false,
  data: {
    color = 'gray',
    hovered: isHovered = false,
    active: isActive = false,
    dimmed: isDimmed = false,
    ...data
  },
  animated = false,
  children,
  style,
}: EdgeContainerProps) {
  animated = animated || isActive
  const props = {
    className: cx(
      className,
      'likec4-edge-container',
      selected && 'selected',
      selectable && 'selectable',
    ),
    'data-likec4-color': color,
    'data-edge-dir': data.dir ?? 'forward',
    'data-edge-active': isActive,
    'data-likec4-hovered': isHovered,
    ...(animated && {
      'data-likec4-animated': animated,
    }),
    ...(selected && {
      'data-likec4-selected': selected,
    }),
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
