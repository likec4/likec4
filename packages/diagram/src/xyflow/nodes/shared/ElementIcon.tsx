import type { DiagramNode } from '@likec4/core'
import clsx from 'clsx'
import type { ElementIconRenderer } from '../../../LikeC4Diagram.props'

export const ElementIcon = (
  {
    element,
    className,
    renderIcon: RenderIcon
  }: {
    element: DiagramNode
    className: string
    renderIcon: ElementIconRenderer | null
  }
) => {
  if (!element.icon || element.icon === 'none') {
    return null
  }
  if (element.icon.startsWith('http://') || element.icon.startsWith('https://')) {
    return (
      <div className={clsx(className, 'likec4-element-icon')}>
        <img src={element.icon} alt={element.title} />
      </div>
    )
  }
  const icon = RenderIcon ? <RenderIcon node={element} /> : null
  if (!icon) {
    return null
  }
  return (
    <div
      className={clsx(
        className,
        'likec4-element-icon'
      )}
      data-likec4-icon={element.icon}
    >
      {icon}
    </div>
  )
}
