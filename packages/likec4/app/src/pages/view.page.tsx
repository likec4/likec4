import { Fragment, Suspense } from 'react'
import { DiagramNotFound } from '../components'
import { Header } from '../components/view-page/Header'
import { useLikeC4View } from '../data'
import type { ViewMode } from '../router'
import { useSearchParams } from '../router'
import { ViewAs, ViewAsReact } from './view-page'

type ViewPageProps = {
  viewId: string
  viewMode: ViewMode
  showUI?: boolean
}

export function ViewPage({ viewId, viewMode, showUI = true }: ViewPageProps) {
  const diagram = useLikeC4View(viewId)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <>
      {viewMode === 'react' && <ViewAsReact diagram={diagram} />}
      {viewMode !== 'react' && (
        <Suspense>
          <ViewAs viewMode={viewMode} viewId={viewId} />
        </Suspense>
      )}
      <Header diagram={diagram} />
    </>
  )
}
