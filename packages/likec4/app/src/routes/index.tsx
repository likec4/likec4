import { createFileRoute } from '@tanstack/react-router'

import { withOverviewGraph } from '../const'
import { OverviewPage } from './-index-overview'
import { IndexPage } from './-index-page'

export const Route = createFileRoute('/')({
  component: withOverviewGraph ? OverviewPage : IndexPage
})
