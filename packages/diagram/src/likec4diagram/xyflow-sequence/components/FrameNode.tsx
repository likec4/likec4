import { css } from '@likec4/styles/css'
import { memo } from 'react'
import type { Types } from '../../types'

type FrameKind = Types.SequenceFrameKind

/** Badge background color per frame kind (inline style — avoids token resolution) */
const kindBadgeBg: Record<FrameKind, string> = {
  if: '#3b82f6',
  optional: '#facc15',
  repeat: '#22c55e',
  parallel: '#a855f7',
  group: '#9ca3af',
  critical: '#ef4444',
  break: '#f97316',
}

/** Badge text color per frame kind */
const kindBadgeColor: Record<FrameKind, string> = {
  if: '#fff',
  optional: '#111827',
  repeat: '#fff',
  parallel: '#fff',
  group: '#111827',
  critical: '#fff',
  break: '#fff',
}

/** Tint fill color per frame kind — used as the bg panel fill at low alpha */
export const kindBorderColor: Record<FrameKind, string> = {
  if: '#60a5fa',
  optional: '#fbbf24',
  repeat: '#4ade80',
  parallel: '#c084fc',
  group: '#d1d5db',
  critical: '#f87171',
  break: '#fb923c',
}

/** Label shown in the branch separator for each kind */
const branchSeparatorLabel: Partial<Record<FrameKind, string>> = {
  if: 'else',
  parallel: 'and',
  critical: 'option',
}

const frameKindLabel: Record<FrameKind, string> = {
  if: 'alt',
  optional: 'opt',
  repeat: 'loop',
  parallel: 'par',
  group: 'group',
  critical: 'critical',
  break: 'break',
}

// ─── FrameBgNode ──────────────────────────────────────────────────────────────
// Translucent fill panel — sits low in the z-stack, no border, no pointer events.

export const FrameBgNode = memo(function FrameBgNode(props: Types.NodeProps<'seq-frame-bg'>) {
  const { kind } = props.data
  const tint = kindBorderColor[kind]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '4px',
        pointerEvents: 'none',
        // ~10% tint of the kind accent color
        backgroundColor: `color-mix(in oklab, ${tint} 10%, transparent)`,
      }}
      data-frame-kind={kind}
    />
  )
})

// ─── FrameNode (chrome) ───────────────────────────────────────────────────────
// Badge + condition text + branch separators — transparent bg, high z.

const containerCss = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: 'sm',
  overflow: 'visible',
  backgroundColor: 'transparent',
  pointerEvents: 'none',
})

const badgeCss = css({
  position: 'absolute',
  top: '0',
  left: '0',
  paddingX: '2',
  paddingY: '0.5',
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '0.5px',
  borderRadius: 'sm',
  lineHeight: '1.2',
  userSelect: 'none',
})

const conditionCss = css({
  position: 'absolute',
  top: '0',
  left: '0',
  paddingTop: '0.5',
  paddingLeft: '2',
  fontSize: 'xs',
  fontStyle: 'italic',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '[#6b7280]',
})

const separatorCss = css({
  position: 'absolute',
  left: '0',
  right: '0',
  height: '0',
  borderTopWidth: '1px',
  borderTopStyle: 'dashed',
  borderTopColor: '[#d1d5db]',
  pointerEvents: 'none',
})

const separatorLabelCss = css({
  position: 'absolute',
  left: '2',
  fontSize: '2xs',
  color: '[#9ca3af]',
  backgroundColor: 'transparent',
  userSelect: 'none',
  lineHeight: '1',
  marginTop: '[-2px]',
})

export const FrameNode = memo(function FrameNode(props: Types.NodeProps<'seq-frame'>) {
  const { data } = props
  const { kind, label, condition, branches } = data

  const headerText = label ?? condition ?? null

  return (
    <div
      className={containerCss}
      data-frame-kind={kind}
    >
      {/* Kind badge at top-left */}
      <span
        className={badgeCss}
        style={{ backgroundColor: kindBadgeBg[kind], color: kindBadgeColor[kind] }}
      >
        {frameKindLabel[kind]}
      </span>

      {/* Header label/condition text */}
      {headerText && (
        <span
          className={conditionCss}
          style={{ marginLeft: `calc(${frameKindLabel[kind].length}ch + 1rem)` }}
        >
          [{headerText}]
        </span>
      )}

      {/* Branch separators */}
      {branches.flatMap((branch, bi) =>
        branch.separatorYs.map((sy, si) => {
          const sepLabel = branchSeparatorLabel[kind]
          const branchHeaderText = branch.label ?? branch.condition
          return (
            <div
              key={`${bi}-${si}`}
              className={separatorCss}
              style={{ top: sy }}
            >
              {(sepLabel || branchHeaderText) && (
                <span className={separatorLabelCss}>
                  {sepLabel}
                  {branchHeaderText ? ` [${branchHeaderText}]` : ''}
                </span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
})
