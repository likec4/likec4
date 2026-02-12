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

/**
 * Attempts to extract and decode SVG content from a data URL.
 * Returns the decoded SVG string if successful, or null if not an SVG data URL.
 */
function decodeSvgDataUrl(dataUrl: string): string | null {
  // Check if it's an SVG data URL
  if (!dataUrl.startsWith('data:image/svg+xml')) {
    return null
  }

  try {
    // Handle both base64 and URL-encoded SVG data URLs
    if (dataUrl.includes(';base64,')) {
      const base64Content = dataUrl.split(';base64,')[1]
      if (base64Content) {
        return atob(base64Content)
      }
    } else {
      // URL-encoded format: data:image/svg+xml,%3csvg...
      const encodedContent = dataUrl.split(',')[1]
      if (encodedContent) {
        return decodeURIComponent(encodedContent)
      }
    }
  } catch {
    // If decoding fails, return null to fall back to img tag
  }
  return null
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
  if (
    element.icon.startsWith('http://') || element.icon.startsWith('https://') || element.icon.startsWith('data:image')
  ) {
    // For SVG data URLs, try to inline the SVG so that CSS color inheritance works (for iconColor support)
    const svgContent = element.icon.startsWith('data:image/svg+xml')
      ? decodeSvgDataUrl(element.icon)
      : null

    if (svgContent) {
      // Inline the SVG content directly
      // This allows CSS `color` property to affect `currentColor` in the SVG
      // Using display: contents so the span doesn't affect flexbox layout
      icon = <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: svgContent }} />
    } else {
      // For non-SVG images (PNG, etc.) or failed SVG decoding, use img tag
      icon = <img src={element.icon} alt={element.title} />
    }
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
