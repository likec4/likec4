import type { DiagramEdge } from '@likec4/core/types'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { BaseEdgePropsWithData } from '../../base/types'
import { cx } from '@likec4/styles/css'
import { edgeLabel } from '@likec4/styles/recipes'
import { type HTMLAttributes, type PropsWithChildren } from 'react'
import { isTruthy } from 'remeda'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'label'
    | 'technology'
  >
>
type EdgeLabelProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    edgeProps: BaseEdgePropsWithData<Data>
    isSequenceStep?: boolean
    stepNum?: number
    pointerEvents?: 'all' | 'none'
  }
>

export function EdgeLabel({
  edgeProps: {
    id,
    data: {
      label,
      technology,
    },
    selectable = false,
  },
  isSequenceStep: isStepEdge = false,
  stepNum,
  pointerEvents = 'all',
  className,
  children,
  ...rest
}: EdgeLabelProps) {
  const hasLabel = isTruthy(label) || isTruthy(technology)

  return (
    <div
      {...rest}
      className={cx(
        // This class is queried by RelationshipPopover to position near the edge label
        'likec4-edge-label',
        edgeLabel({
          pointerEvents,
          isStepEdge,
          cursor: selectable || isStepEdge ? 'pointer' : 'default',
        }),
        className,
      )}
      data-edge-id={id}
    >
      {isStepEdge && stepNum !== undefined && (
        <div className={'likec4-edge-label__step-number'}>
          {stepNum}
        </div>
      )}
      {hasLabel && (
        <div className={'likec4-edge-label__contents'}>
          {isTruthy(label) && (
            <div className={'likec4-edge-label__text'}>
              {label}
            </div>
          )}
          {isTruthy(technology) && (
            <div className={'likec4-edge-label__technology'}>
              {'[ ' + technology + ' ]'}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
