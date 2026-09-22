import type { StepPath } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { m } from 'motion/react'
import { Activity } from 'react'
import { activeFrame, activeFrameBorder, levelBand, nestedBand, recessionOf } from './depth-of-field'
import { FlowRow } from './FlowRow'
import { SEQ_FRAME_LAYOUT_ID, SEQ_TRANSITION } from './motion'
import { flowPresentation } from './presentation'
import { StepRow } from './StepRow'
import { useIsCollapsed, useSelectContext } from './StoreProvider'
import { type CollapsedFlows, type OutlineTreeNodeFlow, type OutlineTreeNodes, isOutlineFlowNode } from './types'

export type OutlineNodesProps = {
  nodes: OutlineTreeNodes
  /** Nesting level of `nodes`, 0 at the root of the outline. */
  depth: number
  activeStep: StepPath
  /** Nesting level the walkthrough currently stands on. */
  activeDepth: number
}

function renderNodes({ nodes, depth, activeStep, activeDepth }: OutlineNodesProps) {
  const recession = recessionOf(depth, activeDepth)
  return nodes.map(node => {
    if (!isOutlineFlowNode(node)) {
      return (
        <StepRow
          key={node.value}
          node={node}
          recession={recession}
          active={node.value === activeStep} />
      )
    }
    return (
      <OutlineFlowNode
        key={node.value}
        node={node}
        depth={depth}
        activeStep={activeStep}
        activeDepth={activeDepth} />
    )
  })
}

/**
 * Renders one nesting level of the outline, recursing into sub-flows.
 *
 * A fragment on the path to the active step is framed and tinted; every other level is
 * pushed back by {@link recessionOf}.
 */
export function OutlineNodes(props: OutlineNodesProps) {
  return <>{renderNodes(props)}</>
  // const recession = recessionOf(depth, activeDepth)
  // return (
  //   <>
  //     {nodes.map(node => {
  //       if (!isOutlineFlowNode(node)) {
  //         return node.value === activeStep
  //           ? <ActiveStepCard key={node.value} node={node} />
  //           : <StepRow key={node.value} node={node} recession={recession} />
  //       }
  //       const isCollapsed = collapsed[node.value] ?? false
  //       const ancestorIndex = ancestors.indexOf(node.value)
  //       const onPath = ancestorIndex >= 0
  //       const myDepth = onPath ? ancestorIndex + 1 : depth
  //       // 0 means "this is the level the walkthrough stands on"
  //       const isCurrentLevel = activeDepth === myDepth
  //       const { paletteClass } = flowPresentation[node.nodeProps.type]
  //       return (
  //         <Box
  //           key={node.value}
  //           className={cx(
  //             paletteClass,
  //             css(
  //               levelBand,
  //               isCurrentLevel && !onPath && nestedBand,
  //               isCurrentLevel && onPath && activeFrame,
  //             ),
  //           )}
  //           style={{
  //             ['--seq-r' as string]: recessionOf(myDepth, activeDepth),
  //             ['--seq-frame-bg' as string]: 'var(--colors-color-palette)',
  //             ['--seq-badge-bg' as string]: 'var(--colors-color-palette-text)',
  //             ['--seq-badge-fg' as string]: 'var(--colors-likec4-panel-bg)',
  //           }}
  //         >
  //           {isCurrentLevel && onPath && (
  //             <m.div
  //               layoutId={SEQ_FRAME_LAYOUT_ID}
  //               className={activeFrameBorder}
  //               transition={SEQ_TRANSITION} />
  //           )}
  //           <FlowRow
  //             node={node}
  //             isCollapsed={isCollapsed}
  //             recession={recession} />
  //           <Activity mode={isCollapsed ? 'hidden' : 'visible'}>
  //             <OutlineNodes
  //               nodes={node.children}
  //               depth={myDepth}
  //               activeStep={activeStep}
  //               activeDepth={activeDepth}
  //               collapsed={collapsed}
  //               ancestors={ancestors} />
  //           </Activity>
  //         </Box>
  //       )
  //     })}
  //   </>
  // )
}

function OutlineFlowNode({
  node,
  depth,
  activeStep,
  activeDepth,
}: {
  node: OutlineTreeNodeFlow
  /** Nesting level of `nodes`, 0 at the root of the outline. */
  depth: number
  activeStep: StepPath
  /** Nesting level the walkthrough currently stands on. */
  activeDepth: number
}) {
  const recession = recessionOf(depth, activeDepth)
  const isCollapsed = useIsCollapsed(node.value)
  const ancestorIndex = useSelectContext(s => s.ancestors.indexOf(node.value))
  const onPath = ancestorIndex >= 0
  const myDepth = onPath ? ancestorIndex + 1 : depth
  // 0 means "this is the level the walkthrough stands on"
  const isCurrentLevel = activeDepth === myDepth
  const { paletteClass } = flowPresentation[node.nodeProps.type]

  return (
    <div
      className={cx(
        paletteClass,
        css(
          levelBand,
          isCurrentLevel && !onPath && nestedBand,
          isCurrentLevel && onPath && activeFrame,
        ),
      )}
      style={{
        ['--seq-r' as string]: recessionOf(myDepth, activeDepth),
        ['--seq-frame-bg' as string]: 'var(--colors-color-palette)',
        ['--seq-badge-bg' as string]: 'var(--colors-color-palette-text)',
        ['--seq-badge-fg' as string]: 'var(--colors-likec4-panel-bg)',
      }}
    >
      {isCurrentLevel && onPath && (
        <m.div
          layoutId={SEQ_FRAME_LAYOUT_ID}
          layout="position"
          layoutAnchor={false}
          layoutCrossfade={false}
          className={activeFrameBorder}
          transition={SEQ_TRANSITION} />
      )}
      <FlowRow
        node={node}
        isCollapsed={isCollapsed}
        recession={recession} />
      <Activity mode={isCollapsed ? 'hidden' : 'visible'}>
        <OutlineNodes
          nodes={node.children}
          depth={myDepth}
          activeStep={activeStep}
          activeDepth={activeDepth} />
      </Activity>
    </div>
  )
}
