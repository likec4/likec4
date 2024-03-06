import { assignInlineVars } from '@vanilla-extract/dynamic'
import type { XYFlowNode } from '../../types'
import * as css from './element.css'

type ElementIconProps = {
  node: XYFlowNode['data']['element']
  maxWidth?: number | undefined
  paddingX?: number | undefined
  paddingY?: number | undefined
}

const { iconMaxH } = css

export function ElementIcon({
  node,
  maxWidth,
  paddingX = 32,
  paddingY = 32
}: ElementIconProps) {
  if (!node.icon) {
    return null
  }
  const firstLabel = node.labels[0]
  if (!firstLabel) {
    return null
  }

  const firstLabelY = Math.floor(firstLabel.pt[1] - firstLabel.fontSize * 1.25)
  const maxIconHeight = Math.floor(firstLabelY - paddingY - 16)
  const maxIconWidth = maxWidth ?? node.width - paddingX * 2

  // const centerY = paddingY + Math.floor(maxIconHeight / 2)
  // const centerX = Math.floor(node.width / 2)

  return (
    <div
      className={css.elementIcon}
      style={assignInlineVars({ iconMaxH }, {
        iconMaxH: maxIconHeight + 'px'
      })}>
      <img
        src={node.icon!}
        alt={node.title}
      />
    </div>
  )
}
