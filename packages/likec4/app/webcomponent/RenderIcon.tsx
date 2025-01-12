import { Icons } from 'virtual:likec4/icons'

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
}

export const RenderIcon = ({ node }: IconRendererProps) => {
  const IconComponent = Icons[node.icon ?? '']
  return IconComponent ? <IconComponent /> : null
}
