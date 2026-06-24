import { css } from '@likec4/styles/css'
import { Panel, useStore } from '@xyflow/react'
import { memo, useCallback } from 'react'
import { selectDiagramActor, useDiagramSnapshot } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

// ─── Selectors ────────────────────────────────────────────────────────────────

/**
 * Returns actor nodes from the current XY node list.
 * Only re-runs when xynodes reference changes.
 */
const selectActorNodes = selectDiagramActor(({ context }) =>
  context.xynodes.filter((n): n is Types.SequenceActorNode => n.type === 'seq-actor')
)

const selectIsSequence = selectDiagramActor(({ context }) =>
  context.dynamicViewVariant === 'sequence' && context.view._type === 'dynamic'
)

// ─── Stable XYFlow transform selector ─────────────────────────────────────────

/** Subscribe only to X component of the viewport transform (pan X + zoom). */
const selectTransformX = (state: { transform: [number, number, number] }) => state.transform[0]
const selectTransformZoom = (state: { transform: [number, number, number] }) => state.transform[2]

// ─── Styles ────────────────────────────────────────────────────────────────────

const panelCss = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  pointerEvents: 'none',
  userSelect: 'none',
  // Remove Panel's default padding/shadow; we control layout manually
  padding: '0',
  margin: '0',
  background: 'transparent',
  boxShadow: 'none',
  // Clip to viewport width so the row never causes a horizontal scrollbar
  overflow: 'hidden',
})

const rowCss = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  height: '36px',
  // Row is wide enough to hold all actor pins at their flow-space X positions
  // Width is set via inline style after reading actor bounds.
})

const labelCss = css({
  position: 'absolute',
  top: '0',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'sm',
  fontWeight: 'bold',
  lineHeight: '1.2',
  textAlign: 'center',
  borderRadius: 'xs',
  paddingX: '1',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  borderWidth: '1px',
  borderStyle: 'solid',
  boxShadow: 'sm',
  pointerEvents: 'none',
})

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a pinned row of actor labels at the top of the viewport while the
 * diagram pans vertically.  The row is kept in sync with the camera's X
 * translation so actor labels stay aligned with their lifeline columns.
 *
 * Implementation: XYFlow `<Panel position="top-left">` + inline transform
 * that mirrors the viewport's X shift (but NOT Y — sticky behaviour).
 */
export const SequenceActorHeaderPanel = memo(function SequenceActorHeaderPanel() {
  const isSequence = useDiagramSnapshot(selectIsSequence)
  if (!isSequence) return null
  return <SequenceActorHeaderPanelInner />
})

const SequenceActorHeaderPanelInner = memo(function SequenceActorHeaderPanelInner() {
  const actorNodes = useDiagramSnapshot(selectActorNodes)

  // Read viewport transform from XYFlow store — only X and zoom matter
  const transformX = useStore(useCallback((s: { transform: [number, number, number] }) => s.transform[0], []))
  const zoom = useStore(useCallback((s: { transform: [number, number, number] }) => s.transform[2], []))

  if (actorNodes.length === 0) return null

  // Compute the total row width: rightmost actor right edge (in screen space)
  const maxRight = Math.max(
    ...actorNodes.map(n => (n.position.x + (n.width ?? 56)) * zoom + transformX),
  )
  const rowWidth = Math.max(maxRight, 0)

  return (
    <Panel position="top-left" className={panelCss}>
      <div
        className={rowCss}
        style={{ width: rowWidth }}
      >
        {actorNodes.map(n => {
          const nodeWidth = n.width ?? 56
          // Convert flow-space X to screen-space X
          const screenX = n.position.x * zoom + transformX
          const screenWidth = nodeWidth * zoom

          return (
            <div
              key={n.id}
              className={labelCss}
              data-likec4-color={n.data.color ?? 'gray'}
              title={n.data.title}
              style={{
                left: screenX,
                width: screenWidth,
                backgroundColor: 'var(--likec4-palette-fill)',
                borderColor: 'var(--likec4-palette-stroke)',
                color: 'var(--likec4-palette-hiContrast)',
              }}
            >
              {n.data.title}
            </div>
          )
        })}
      </div>
    </Panel>
  )
})
