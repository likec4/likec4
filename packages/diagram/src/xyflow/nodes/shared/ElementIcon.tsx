import clsx from 'clsx'
import { m } from 'framer-motion'
import type { ElementIconNodeProps, ElementIconRenderer } from '../../../LikeC4Diagram.props'

export const ElementIcon = ({
  element,
  viewId,
  className,
  renderIcon: RenderIcon
}: {
  element: ElementIconNodeProps
  viewId: string
  className: string
  renderIcon: ElementIconRenderer | null
}) => {
  if (!element.icon || element.icon === 'none') {
    return null
  }
  let icon = null as React.ReactNode
  if (element.icon.startsWith('http://') || element.icon.startsWith('https://')) {
    icon = <img src={element.icon} alt={element.title} />
  } else if (RenderIcon) {
    icon = <RenderIcon node={element} />
  }

  if (!icon) {
    return null
  }
  return (
    <m.div
      key={`${viewId}:element:icon:${element.id}`}
      layoutId={`${viewId}:element:icon:${element.id}`}
      className={clsx(
        className,
        'likec4-element-icon'
      )}
      data-likec4-icon={element.icon}
    >
      {icon}
    </m.div>
  )
}
