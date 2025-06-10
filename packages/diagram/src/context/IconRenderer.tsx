import type { ElementShape } from '@likec4/core'
import { cx as clsx } from '@likec4/styles/css'
import {
  type Icon,
  type IconProps,
  IconBrowser,
  IconCylinder,
  IconDeviceMobile,
  IconRectangularPrism,
  IconReorder,
  IconUser,
} from '@tabler/icons-react'
import {
  type ForwardRefExoticComponent,
  type PropsWithChildren,
  type ReactNode,
  type RefAttributes,
  createContext,
  useContext,
} from 'react'
import type { ElementIconRenderer } from '../LikeC4Diagram.props'

const IconRendererContext = createContext<ElementIconRenderer | null>(null)

export function IconRendererProvider({
  value,
  children,
}: PropsWithChildren<{ value: ElementIconRenderer | null }>) {
  const outerScope = useContext(IconRendererContext)
  if (outerScope) {
    return <>{children}</>
  }
  return (
    <IconRendererContext.Provider value={value}>
      {children}
    </IconRendererContext.Provider>
  )
}

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
  if (
    element.icon.startsWith('http://') || element.icon.startsWith('https://')
  ) {
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

const ShapeIcons = {
  browser: IconBrowser,
  cylinder: IconCylinder,
  mobile: IconDeviceMobile,
  person: IconUser,
  queue: IconReorder,
  rectangle: IconRectangularPrism,
  storage: IconCylinder,
} satisfies Record<ElementShape, ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>>

export function IconOrShapeRenderer({
  element,
  className,
}: {
  element: {
    id: string
    title: string
    shape: ElementShape
    icon?: string | null | undefined
  }
  className: string
}) {
  const icon = <IconRenderer element={element} className={className} />
  if (icon) {
    return icon
  }
  const ShapeIcon = ShapeIcons[element.shape]
  return (
    <div
      className={clsx(
        className,
        'likec4-shape-icon',
      )}
    >
      <ShapeIcon />
    </div>
  )
}
