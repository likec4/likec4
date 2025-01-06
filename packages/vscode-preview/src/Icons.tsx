import type { ElementIconRenderer } from '@likec4/diagram'
import Icons from '@likec4/icons/all'

export const IconRenderer: ElementIconRenderer = ({ node }) => {
  if (!node.icon || node.icon === 'none') {
    return null
  }
  return <Icons name={(node.icon ?? '') as any} />
}
