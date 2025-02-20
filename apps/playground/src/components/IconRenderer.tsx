import type { ElementIconRenderer } from '@likec4/diagram'
import { Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'

const Icons = lazy(() => import('@likec4/icons/all'))

export const IconRenderer: ElementIconRenderer = ({ node }) => {
  return (
    <Suspense fallback={<Loader type="oval" size="xs" />}>
      <Icons name={(node.icon ?? '') as any} />
    </Suspense>
  )
}
