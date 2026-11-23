import { LikeC4ProjectsOverview, useChangeLikeC4Project } from '@likec4/diagram'
import { openProjectInEditor } from '@likec4/vite-plugin/internal'
import { IconLayoutGrid, IconList, IconTopologyStar3 } from '@tabler/icons-react'
import { isDevelopment } from 'likec4:app-config'
import { useLikeC4Projects } from 'likec4:projects'
import { useLikeC4ProjectsOverview } from 'likec4:projects-overview'
import { type ReactNode, useMemo, useState } from 'react'
import { ColorSchemeToggle } from '../components/ColorSchemeToggle'
import { Metric, MetricsRow } from '../components/ui/Metric'
import {
  Page,
  PageCanvas,
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
import { type CatalogSort, buildProjectsCatalog, selectProjects } from '../components/workspace-overview/catalog'
import { ProjectsCards } from '../components/workspace-overview/ProjectsCards'
import { ProjectsTable } from '../components/workspace-overview/ProjectsTable'
import { WorkspaceSearchTrigger } from '../components/workspace-search/SearchTrigger'
import { WorkspaceSearchProvider } from '../components/workspace-search/WorkspaceSearchProvider'

export type WorkspaceOverviewMode = 'cards' | 'table' | 'map'

const SORT_OPTIONS: ReadonlyArray<SortOption<CatalogSort>> = [
  { value: 'name', label: 'Name' },
  { value: 'elements', label: 'Elements' },
  { value: 'usedBy', label: 'Most depended on' },
]

const MODES: ReadonlyArray<ViewModeOption<WorkspaceOverviewMode>> = [
  { value: 'cards', label: 'Cards', icon: <IconLayoutGrid size={14} aria-hidden /> },
  { value: 'table', label: 'Table', icon: <IconList size={14} aria-hidden /> },
  { value: 'map', label: 'Map', icon: <IconTopologyStar3 size={14} aria-hidden /> },
]

// project config opens in the editor only from the dev server
const onOpenSource = isDevelopment ? openProjectInEditor : undefined

export function WorkspaceOverviewPage({ view, onViewChange }: {
  view: WorkspaceOverviewMode
  onViewChange: (view: WorkspaceOverviewMode) => void
}) {
  const changeProject = useChangeLikeC4Project()
  const projectsOverview = useLikeC4ProjectsOverview()
  const projectInfos = useLikeC4Projects()
  const catalog = useMemo(
    () => buildProjectsCatalog(projectsOverview, projectInfos),
    [projectsOverview, projectInfos],
  )

  const [sort, setSort] = useState<CatalogSort>('name')
  const visible = useMemo(() => selectProjects(catalog.projects, sort), [catalog, sort])
  const { totals } = catalog
  const isMap = view === 'map'

  const top = (
    <>
      <PageHeader>
        <PageHeading>
          <PageLogo />
          <PageTitle>Projects</PageTitle>
        </PageHeading>
        <MetricsRow>
          <Metric label="Projects" value={totals.projects} size="lg" />
          <Metric label="Elements" value={totals.elements} size="lg" />
          <Metric label="Views" value={totals.views} size="lg" />
        </MetricsRow>
      </PageHeader>

      <Toolbar role="toolbar" aria-label="Projects">
        <WorkspaceSearchTrigger />
        {!isMap && <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} label="Sort projects by" />}
        <ToolbarSpacer />
        <ViewModeSwitch modes={MODES} value={view} onChange={onViewChange} />
        <ColorSchemeToggle />
      </Toolbar>
    </>
  )

  let page: ReactNode
  switch (true) {
    case isMap:
      page = (
        <>
          {top}
          <PageCanvas>
            <LikeC4ProjectsOverview
              view={projectsOverview}
              onNavigateToProject={changeProject}
              hideNavigationPanel
            />
          </PageCanvas>
        </>
      )
      break
    default:
      page = (
        <PageScroll>
          {top}
          <PageSection as="main">
            {view === 'table'
              ? <ProjectsTable projects={visible} />
              : <ProjectsCards projects={visible} onOpenSource={onOpenSource} />}
          </PageSection>
        </PageScroll>
      )
  }

  return (
    <WorkspaceSearchProvider>
      <Page>{page}</Page>
    </WorkspaceSearchProvider>
  )
}
