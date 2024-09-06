import { createFileRoute } from '@tanstack/react-router'

import { lazy, Suspense } from 'react'
import { withOverviewGraph } from '../const'
import IndexPage from './-index-page'

const OverviewGraph = /* @__PURE__ */ lazy(() => import('./-index-overview'))

function WithOverviewGraph() {
  return (
    <Suspense>
      <OverviewGraph />
    </Suspense>
  )
}

export const Route = createFileRoute('/')({
  component: withOverviewGraph ? WithOverviewGraph : IndexPage
})
