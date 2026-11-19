import { useLikeC4Model } from '@likec4/diagram'
import { Burger } from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import { pageTitle } from 'likec4:app-config'
import { useMemo, useState } from 'react'
import { ColorSchemeToggle } from '../components/ColorSchemeToggle'
import { ViewCards, ViewsTable } from '../components/project-index/ViewCards'
import { type ViewSort, indexViews, sortViews } from '../components/project-index/views'
import { SidebarDrawer } from '../components/sidebar/Drawer'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { Metric, MetricsRow } from '../components/ui/Metric'
import {
  Page,
  PageHeader,
  PageHeading,
  PageLogo,
  PageScroll,
  PageSection,
  PageTitle,
  Toolbar,
  ToolbarSpacer,
} from '../components/ui/Page'
import { type SortOption, type ViewModeOption, SortMenu, ViewModeSwitch } from '../components/ui/Toolbar'
import { WorkspaceSearchTrigger } from '../components/workspace-search/SearchTrigger'
import { WorkspaceSearchProvider } from '../components/workspace-search/WorkspaceSearchProvider'
import { filterLandingPageViews } from '../filterLandingPageViews'
import { useCurrentProject, useLikeC4Views } from '../hooks'

export type ProjectIndexMode = 'cards' | 'table'

const SORT_OPTIONS: ReadonlyArray<SortOption<ViewSort>> = [
  { value: 'name', label: 'Name' },
  { value: 'folder', label: 'Folder' },
  { value: 'type', label: 'Type' },
]

const MODES: ReadonlyArray<ViewModeOption<ProjectIndexMode>> = [
  { value: 'cards', label: 'Cards', icon: <IconLayoutGrid size={14} aria-hidden /> },
  { value: 'table', label: 'Table', icon: <IconList size={14} aria-hidden /> },
]

/**
 * Landing page of a single-project workspace: the project's views as cards or a table,
 * with the same header, toolbar and search as the projects page
 */
export function ProjectIndexPage({ mode, onModeChange }: {
  mode: ProjectIndexMode
  onModeChange: (mode: ProjectIndexMode) => void
}) {
  const model = useLikeC4Model()
  const allViews = useLikeC4Views()
  const { id: projectId, landingPage, title: projectTitle } = useCurrentProject()
  const title = projectTitle ?? pageTitle
  useDocumentTitle(title)

  const views = useMemo(
    () => indexViews(model, filterLandingPageViews(allViews, landingPage)),
    [model, allViews, landingPage],
  )
  const totals = useMemo(() => ({
    elements: [...model.elements()].filter(e => !e.imported).length,
    relationships: [...model.relationships()].length,
  }), [model])

  const [sort, setSort] = useState<ViewSort>('name')
  const sorted = useMemo(() => sortViews(views, sort), [views, sort])

  return (
    <WorkspaceSearchProvider>
      <Page>
        <SidebarDrawer />
        <PageScroll>
          <PageHeader>
            <PageHeading>
              <Burger size="sm" flex="none" onClick={SidebarDrawerOps.open} aria-label="Toggle navigation" />
              <PageLogo />
              <PageTitle>{title}</PageTitle>
            </PageHeading>
            <MetricsRow>
              <Metric label="Elements" value={totals.elements} size="lg" />
              <Metric label="Relationships" value={totals.relationships} size="lg" />
              <Metric label="Views" value={views.length} size="lg" />
            </MetricsRow>
          </PageHeader>

          <Toolbar role="toolbar" aria-label="Views">
            <WorkspaceSearchTrigger label="Search elements and views" />
            <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} label="Sort views by" />
            <ToolbarSpacer />
            <ViewModeSwitch modes={MODES} value={mode} onChange={onModeChange} />
            <ColorSchemeToggle />
          </Toolbar>

          <PageSection as="main">
            {mode === 'table'
              ? <ViewsTable projectId={projectId} views={sorted} />
              : <ViewCards projectId={projectId} views={sorted} />}
          </PageSection>
        </PageScroll>
      </Page>
    </WorkspaceSearchProvider>
  )
}
