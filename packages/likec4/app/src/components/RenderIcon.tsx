import { Icons } from 'virtual:likec4/icons'

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}

export function RenderIcon({ node }: IconRendererProps) {
  const IconComponent = Icons[node.icon ?? '']
  if (!IconComponent) {
    return null
  }
  return <IconComponent />
}
