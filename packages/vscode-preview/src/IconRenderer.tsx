import { DefaultMap } from '@likec4/core/utils'
import { type ElementIconRenderer, type ElementIconRendererProps, IconRendererProvider } from '@likec4/diagram'
import { type CSSProperties, lazy, memo, Suspense } from 'react'
import { ExtensionApi as extensionApi } from './vscode'

const iconUrl = (group: string, name: string) => `https://icons.like-c4.dev/${group}/${name}.svg`

export function decodeSvgDataUrl(dataUrl: string): string | null {
  if (!dataUrl.startsWith('data:image/svg+xml')) {
    return null
  }

  try {
    if (dataUrl.includes(';base64,')) {
      const base64Content = dataUrl.split(';base64,')[1]
      if (base64Content) {
        return atob(base64Content)
      }
    } else {
      const encodedContent = dataUrl.split(',')[1]
      if (encodedContent) {
        return decodeURIComponent(encodedContent)
      }
    }
  } catch {
    // Fall back to rendering the data URL as an image.
  }

  return null
}

function InlineSvgIcon({ svg }: { svg: string }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: svg }} />
}

function BootstrapIconMask({ name, ...props }: Omit<ElementIconRendererProps, 'node'> & { name: string }) {
  const url = iconUrl('bootstrap', name)
  const style = {
    display: 'inline-block',
    width: '100%',
    height: '100%',
    backgroundColor: 'currentColor',
    maskImage: `url("${url}")`,
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
    WebkitMaskImage: `url("${url}")`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: 'contain',
  } satisfies CSSProperties
  return <span {...props} aria-hidden="true" style={style} />
}

const DefaultIconRenderer: ElementIconRenderer = ({ node, ...props }) => {
  if (!node.icon || node.icon === 'none') {
    return null
  }
  const [group, name] = node.icon.split(':') as [string, string]
  if (!group || !name) {
    return null
  }

  if (group === 'bootstrap') {
    return <BootstrapIconMask {...props} name={name} />
  }

  return <img {...props} src={iconUrl(group, name)} />
}

const icons = new DefaultMap<string, ElementIconRenderer>(icon => {
  // For local files, use lazy loading with custom loader
  return lazy(async () => {
    try {
      const { base64data } = await extensionApi.readLocalIcon(icon)

      if (!base64data) {
        // Fallback to default renderer if file cannot be read
        return {
          default: DefaultIconRenderer,
        }
      }

      const svg = decodeSvgDataUrl(base64data)
      return {
        default: svg ? () => <InlineSvgIcon svg={svg} /> : () => <img src={base64data} alt="" />,
      }
    } catch (error) {
      console.error(error)
      // Fallback to default renderer on any error
      return {
        default: DefaultIconRenderer,
      }
    }
  })
})

/**
 * Custom IconRenderer for VSCode preview that handles local file:// URLs
 * by requesting base64 data from the extension
 */
export const IconRenderer = memo((props: ElementIconRendererProps) => {
  const icon = props.node.icon

  // If not a local file URL, use the default IconRenderer
  if (!icon || !icon.startsWith('file:')) {
    return <DefaultIconRenderer {...props} />
  }

  // For local files, use lazy loading with custom loader
  const LocalIcon = icons.get(icon)
  return (
    <Suspense>
      <LocalIcon {...props} />
    </Suspense>
  )
}, (a, b) => a.node.icon == b.node.icon)

export function IconsProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconRendererProvider value={IconRenderer}>
      {children}
    </IconRendererProvider>
  )
}
