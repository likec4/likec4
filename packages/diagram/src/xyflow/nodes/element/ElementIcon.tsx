import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import type { XYFlowNode } from '../../types'
import { elementIcon, iconOffsetY } from './element.css'

type ElementIconProps = {
  node: XYFlowNode['data']['element']
}

export function ElementIcon({
  node: {
    icon,
    title,
    labelBBox
  }
}: ElementIconProps) {
  if (!icon) {
    return null
  }

  return (
    <div
      className={clsx(elementIcon, 'likec4-element-icon')}
      style={assignInlineVars({ iconOffsetY }, {
        iconOffsetY: labelBBox.y + 'px'
      })}>
      <img
        src={icon}
        alt={title}
      />
    </div>
  )
}
