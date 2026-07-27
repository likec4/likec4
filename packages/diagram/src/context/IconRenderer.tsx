import type { ElementShape } from '@likec4/core'
import { cx as clsx } from '@likec4/styles/css'
import {
  type IconProps,
  IconBrowser,
  IconCylinder,
  IconDeviceMobile,
  IconFileText,
  IconRectangularPrism,
  IconReorder,
  IconUser,
} from '@tabler/icons-react'
import {
  type CSSProperties,
  type ForwardRefExoticComponent,
  type PropsWithChildren,
  type ReactNode,
  type RefAttributes,
  createContext,
  useContext,
  useMemo,
} from 'react'
import type { ElementIconRenderer } from '../LikeC4Diagram.props'

const IconRendererContext = createContext<ElementIconRenderer | null>(null)

/**
 * Provider for custom element icon renderers
 *
 * @example
 * ```tsx
 * const MyIconRenderer: ElementIconRenderer = ({ node }) => {
 *   return <div>{node.title}</div>
 * }
 *
 * <IconRendererProvider value={MyIconRenderer}>
 *   <LikeC4Diagram />
 * </IconRendererProvider>
 * ```
 */
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
  style,
}: {
  element?: {
    id: string
    title: string
    icon?: string | null | undefined
  }
  className?: string | undefined
  style?: CSSProperties | undefined
}): ReactNode {
  const RenderIcon = useContext(IconRendererContext)
  if (!element || !element.icon || element.icon === 'none') {
    return null
  }
  let icon: ReactNode
  switch (true) {
    case element.icon.startsWith('data:image/svg+xml'):
      icon = <SvgDataUrlIcon dataUrl={element.icon} alt={element.title} />
      break
    case element.icon.startsWith('http://'):
    case element.icon.startsWith('https://'):
    case element.icon.startsWith('data:image'):
      icon = <img src={element.icon} alt={element.title} />
      break
    case !!RenderIcon:
      icon = <RenderIcon node={element} />
      break
    default:
      icon = null
      break
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
      style={style}
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
  bucket: IconCylinder,
  document: IconFileText,
  component: IconRectangularPrism,
} as const satisfies {
  [key in ElementShape]: ForwardRefExoticComponent<
    IconProps & RefAttributes<SVGSVGElement>
  >
}

export function IconOrShapeRenderer({
  element,
  className,
  style,
}: {
  element: {
    id: string
    title: string
    shape: ElementShape
    icon?: string | null | undefined
  }
  className?: string
  style?: CSSProperties | undefined
}) {
  if (!element.icon || element.icon === 'none') {
    const ShapeIcon = ShapeIcons[element.shape]
    return (
      <div
        className={clsx(
          className,
          'likec4-shape-icon',
        )}
        style={style}
      >
        <ShapeIcon />
      </div>
    )
  }
  return <IconRenderer element={element} className={className} style={style} />
}

function SvgDataUrlIcon({ dataUrl, alt }: { dataUrl: string; alt?: string }) {
  const shouldUseMask = useMemo(() => hasCurrentColorReference(dataUrl), [dataUrl])

  if (!shouldUseMask) {
    return <img src={dataUrl} alt={alt} />
  }

  const maskUrl = `url(${JSON.stringify(dataUrl)})`
  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt}
      style={{
        display: 'inline-block',
        width: '100%',
        height: '100%',
        backgroundColor: 'currentColor',
        maskImage: maskUrl,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: maskUrl,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
      }}
    />
  )
}

function hasCurrentColorReference(dataUrl: string): boolean {
  return /currentcolor/i.test(decodeSvgDataUrl(dataUrl) ?? '')
}

function decodeSvgDataUrl(dataUrl: string): string | null {
  if (!dataUrl.startsWith('data:image/svg+xml')) {
    return null
  }

  try {
    const comma = dataUrl.indexOf(',')
    if (comma === -1) {
      return null
    }

    const payload = dataUrl.slice(comma + 1)
    if (dataUrl.slice(0, comma).endsWith(';base64')) {
      return new TextDecoder().decode(Uint8Array.from(atob(payload), c => c.charCodeAt(0)))
    }

    try {
      return decodeURIComponent(payload)
    } catch {
      return payload
    }
  } catch {
    return null
  }
}
