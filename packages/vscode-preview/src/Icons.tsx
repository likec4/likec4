import type { ElementIconRenderer } from '@likec4/diagram'
import { IconLoader } from '@tabler/icons-react'
import { lazy, Suspense } from 'react'

const Icons = lazy(() => import('@likec4/icons/all'))

export const IconRenderer: ElementIconRenderer = ({ node }) => {
  if (!node.icon || node.icon === 'none') {
    return null
  }
  return (
    <Suspense fallback={<IconLoader />}>
      <Icons name={(node.icon ?? '') as any} />
    </Suspense>
  )
}
