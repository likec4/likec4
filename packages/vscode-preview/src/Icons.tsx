import type { ElementIconRenderer } from '@likec4/diagram'
import Icon from '@likec4/icons/all'

export const IconRenderer: ElementIconRenderer = ({ node }) => {
  return <Icon name={(node.icon ?? '') as any} />
}
