import { DefaultMap } from '@likec4/core/utils'
import { type ElementIconRenderer, type ElementIconRendererProps, IconRendererProvider } from '@likec4/diagram'
import { type CSSProperties, lazy, memo, Suspense } from 'react'
import { ExtensionApi as extensionApi } from './vscode'

const iconUrl = (group: string, name: string) => `https://icons.like-c4.dev/${group}/${name}.svg`

function SvgMask({ src, ...props }: Omit<ElementIconRendererProps, 'node'> & { src: string }) {
  const maskUrl = `url(${JSON.stringify(src)})`
  return (
    <span
      {...props}
      aria-hidden="true"
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

export function localIconRendererFromDataUrl(base64data: string | null): ElementIconRenderer {
  if (!base64data) {
    return () => null
  }

  if (hasCurrentColorReference(base64data)) {
    return ({ node: _node, ...props }) => <SvgMask {...props} src={base64data} />
  }

  return ({ node: _node, ...props }) => <img {...props} src={base64data} alt="" />
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

const icons = new DefaultMap<string, ElementIconRenderer>(icon => {
  // For local files, use lazy loading with custom loader
  return lazy(async () => {
    try {
      const { base64data } = await extensionApi.readLocalIcon(icon)

      return {
        default: localIconRendererFromDataUrl(base64data),
      }
    } catch (error) {
      console.error(error)
      // Local files should not be routed through the bundled-icon CDN fallback.
      return {
        default: () => null,
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
