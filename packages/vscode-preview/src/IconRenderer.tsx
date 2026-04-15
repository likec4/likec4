import { DefaultMap } from '@likec4/core/utils'
import { type ElementIconRenderer, type ElementIconRendererProps, IconRendererProvider } from '@likec4/diagram'
import { lazy, memo, Suspense } from 'react'
import { ExtensionApi as extensionApi } from './vscode'

const DefaultIconRenderer: ElementIconRenderer = ({ node, ...props }) => {
  if (!node.icon || node.icon === 'none') {
    return null
  }
  const [group, name] = node.icon.split(':') as [string, string]
  if (!group || !name) {
    return null
  }

  return <img {...props} src={`https://icons.like-c4.dev/${group}/${name}.svg`} />
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

      return {
        default: (_: ElementIconRendererProps) => <img src={base64data} alt="" />,
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
