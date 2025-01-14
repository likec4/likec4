import clsx from 'clsx'
import { type ReactNode, createContext, useContext } from 'react'
import type { ElementIconRenderer } from '../LikeC4Diagram.props'

const IconRendererContext = createContext<ElementIconRenderer | null>(null)

export const IconRendererProvider = IconRendererContext.Provider

export function IconRenderer({
  element,
  className,
}: {
  element?: {
    id: string
    title: string
    icon?: string | null | undefined
  }
  className: string
}) {
  const RenderIcon = useContext(IconRendererContext)
  if (!element || !element.icon || element.icon === 'none') {
    return null
  }
  let icon: ReactNode
  if (element.icon.startsWith('http://') || element.icon.startsWith('https://')) {
    icon = <img src={element.icon} alt={element.title} />
  } else if (RenderIcon) {
    icon = <RenderIcon node={element} />
  }

  if (!icon) {
    return null
  }
  return (
    <div
      className={clsx(
        className,
        'likec4-element-icon',
      )}
      data-likec4-icon={element.icon}
    >
      {icon}
    </div>
  )
}
