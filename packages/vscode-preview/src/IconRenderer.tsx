import { DefaultMap } from '@likec4/core/utils'
import type { ElementIconRenderer, ElementIconRendererProps } from '@likec4/diagram'
import { IconRenderer as DefaultIconRenderer } from '@likec4/icons/all'
import { lazy, Suspense } from 'react'
import { ExtensionApi as extensionApi } from './vscode'

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
export function IconRenderer(props: ElementIconRendererProps) {
  const icon = props.node.icon

  // If not a local file URL, use the default IconRenderer
  if (!icon || !icon.startsWith('file:')) {
    return <DefaultIconRenderer {...props} />
  }

  // For local files, use lazy loading with custom loader
  const LocalIcon = icons.get(icon)
  return (
    <Suspense fallback={<DefaultIconRenderer {...props} />}>
      <LocalIcon {...props} />
    </Suspense>
  )
}
