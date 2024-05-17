import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import type { XYFlowNode } from '../../types'
import { elementIcon, iconMaxH } from './element.css'

type ElementIconProps = {
  node: XYFlowNode['data']['element']
  maxWidth?: number | undefined
  paddingX?: number | undefined
  paddingY?: number | undefined
}

export function ElementIcon({
  node,
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
  // const maxIconWidth = maxWidth ?? node.width - paddingX * 2

  // const centerY = paddingY + Math.floor(maxIconHeight / 2)
  // const centerX = Math.floor(node.width / 2)

  return (
    <div
      className={clsx(elementIcon, 'likec4-element-icon')}
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
