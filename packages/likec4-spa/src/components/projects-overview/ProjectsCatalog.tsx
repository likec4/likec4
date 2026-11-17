import { defaultTheme } from '@likec4/core/styles'
import type { ProjectId } from '@likec4/core/types'
import { ifilter, imap, toArray } from '@likec4/core/utils'
import { ViewIcon } from '@likec4/diagram'
import { css, cx } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { searchOverlay } from '@likec4/styles/recipes'
import { computed, openProjectInEditor } from '@likec4/vite-plugin/internal'
import { HoverCard, Tooltip } from '@mantine/core'
import { useStore } from '@nanostores/react'
import { IconAlertTriangleFilled, IconArrowUpRight, IconChevronDown, IconFolder, IconUser } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { isDevelopment } from 'likec4:app-config'
import { loadModel } from 'likec4:model'
import { type CSSProperties, memo, Suspense, use, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { hasAtLeast, isDeepEqual, pipe } from 'remeda'
import {
  type CatalogProject,
  type ProjectLink,
  monogramColor,
  projectInitials,
} from './catalog'
import * as styles from './styles'
import { CardGrid } from './styles'

const MAX_MINIS = 3
const numberFormat = new Intl.NumberFormat('en-US')

function formatCount(value: number | null): string {
  return value === null ? '—' : numberFormat.format(value)
}

function monoStyle(projectId: string): CSSProperties {
  const color = defaultTheme.colors[monogramColor(projectId)].elements.stroke
  // custom property consumed by styles.monogram
  return { ['--mono' as string]: color }
}

export function ProjectMonogram({ projectId, title, size }: {
  projectId: string
  title: string
  size: 'lg' | 'sm' | 'mini' | 'chip'
}) {
  return (
    <Monogram data-size={size} style={monoStyle(projectId)} aria-hidden="true">
      {projectInitials(title)}
    </Monogram>
  )
}

function relationshipsLabel(count: number): string {
  return `${count} relationship${count === 1 ? '' : 's'}`
}

function DependencySummary({ label, links }: { label: string; links: ReadonlyArray<ProjectLink> }) {
  const shown = links.slice(0, MAX_MINIS)
  const hidden = links.slice(MAX_MINIS)
  const names = links.map(l => l.title).join(', ')
  return (
    <div className={styles.depSummary} role="group" aria-label={`${label}: ${names || 'none'}`}>
      <span className={styles.fieldLabel} aria-hidden="true">{label}</span>
      {links.length === 0
        ? <span className={styles.depEmpty} aria-hidden="true">—</span>
        : (
          <span className={styles.stack} aria-hidden="true">
            {shown.map(link => (
              <Tooltip
                key={link.projectId}
                label={`${link.title} · ${relationshipsLabel(link.relationships)}`}
                withArrow>
                <Monogram data-size="mini" style={monoStyle(link.projectId)}>
                  {projectInitials(link.title)}
                </Monogram>
              </Tooltip>
            ))}
            {hidden.length > 0 && (
              <Tooltip
                label={hidden.map(l => `${l.title} · ${l.relationships}`).join(', ')}
                withArrow
                multiline
                maw={260}>
                <span className={styles.miniMore}>+{hidden.length}</span>
              </Tooltip>
            )}
          </span>
        )}
    </div>
  )
}

function DependencyList({ label, empty, links }: {
  label: string
  empty: string
  links: ReadonlyArray<ProjectLink>
}) {
  return (
    <div className={styles.depsGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      {links.length === 0 && <span className={styles.depEmpty}>{empty}</span>}
      {links.map(link => (
        <Link
          key={link.projectId}
          className={styles.depsItem}
          to="/project/$projectId/"
          params={{ projectId: link.projectId }}>
          <ProjectMonogram projectId={link.projectId} title={link.title} size="mini" />
          <span>{link.title}</span>
          <span>{link.relationships} rel</span>
        </Link>
      ))}
    </div>
  )
}

export function Metric({ label, value, size }: { label: string; value: number | null; size?: 'lg' }) {
  return (
    <div className={styles.metric}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.metricValue} data-size={size}>{formatCount(value)}</span>
    </div>
  )
}

function ProjectCard({ project }: { project: CatalogProject }) {
  const [expanded, setExpanded] = useState(false)
  const panelId = `project-deps-${project.id}`
  return (
    <styled.article className={styles.card}>
      <div className={cx('group', styles.cardHead, styles.cardHeadLinked)}>
        <ProjectMonogram projectId={project.id} title={project.title} size="lg" />
        <div className={styles.cardTitles}>
          <h3 className={styles.cardTitle}>
            <Link
              className={styles.cardLink}
              to="/project/$projectId/"
              params={{ projectId: project.id }}
              title={project.title}>
              {project.title}
            </Link>
          </h3>
          <span className={styles.cardSub}>
            {project.id}
          </span>
        </div>
        <IconArrowUpRight size={18} className={styles.cardOpen} aria-hidden />
      </div>
      <div className={styles.cardBody}>
        {project.contactPerson && (
          <div className={styles.detail}>
            <IconUser size={14} aria-hidden />
            <span title={project.contactPerson}>{project.contactPerson}</span>
          </div>
        )}
        {isDevelopment
          ? (
            <button
              type="button"
              className={cx(styles.detail, styles.detailButton)}
              data-empty={!project.path || undefined}
              title="Open project config in editor"
              onClick={() => openProjectInEditor(project.id)}>
              <IconFolder size={14} aria-hidden />
              <span>{project.path ?? '—'}</span>
            </button>
          )
          : (
            <div className={styles.detail} data-empty={!project.path || undefined}>
              <IconFolder size={14} aria-hidden />
              <span title={project.path ?? undefined}>{project.path ?? '—'}</span>
            </div>
          )}
        {project.views && <ProjectDriftsWarning projectId={project.id} />}
      </div>
      <HoverCard
        openDelay={600}
        closeDelay={100}
        position="bottom-start"
        offset={6}
        shadow="md"
        withinPortal>
        <HoverCard.Target>
          <div className={styles.cardFoot}>
            <DependencySummary label="Depends on" links={project.dependsOn} />
            <DependencySummary label="Used by" links={project.usedBy} />
            <button
              type="button"
              className={styles.expand}
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={`${expanded ? 'Hide' : 'Show'} dependencies of ${project.title}`}
              onClick={() => setExpanded(v => !v)}>
              <IconChevronDown size={16} />
            </button>
          </div>
        </HoverCard.Target>
        <HoverCard.Dropdown className={styles.metricsCard}>
          <Metric label="Elements" value={project.elements} />
          <Metric label="Relationships" value={project.relationships} />
          <Metric label="Views" value={project.views} />
        </HoverCard.Dropdown>
      </HoverCard>
      {expanded && (
        <div className={styles.expandPanel} id={panelId}>
          <DependencyList label="Depends on" empty="No dependencies" links={project.dependsOn} />
          <DependencyList label="Used by" empty="Not used by other projects" links={project.usedBy} />
        </div>
      )}
    </styled.article>
  )
}

export function ProjectsCards({ projects }: { projects: ReadonlyArray<CatalogProject> }) {
  return (
    <CardGrid>
      {projects.map(project => <ProjectCard key={project.id} project={project} />)}
    </CardGrid>
  )
}

const Monogram = styled('span', {
  base: {
    flexShrink: '0',
    display: 'inline-grid',
    placeItems: 'center',
    // --mono is the element stroke color of the project's palette
    backgroundColor: '[var(--mono)]',
    color: 'white',
    fontFamily: 'body',
    fontWeight: 'semibold',
    letterSpacing: '[0.02em]',
    borderRadius: 'sm',
    '&[data-size="lg"]': {
      width: '[36px]',
      height: '[36px]',
      fontSize: 'sm',
    },
    '&[data-size="sm"]': {
      width: '[24px]',
      height: '[24px]',
      fontSize: 'xxs',
    },
    '&[data-size="chip"]': {
      width: '[20px]',
      height: '[20px]',
      fontSize: 'micro',
    },
    '&[data-size="mini"]': {
      width: '[22px]',
      height: '[22px]',
      fontSize: 'micro',
      // ring in the card surface, so overlapping monograms stay readable
      boxShadow: '[0 0 0 2px var(--colors-surface-default)]',
      cursor: '[help]',
    },
  },
})

const drifts = searchOverlay({ size: 'sm' })

const driftsCard = css({
  width: '[320px]',
  padding: '1.5',
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
})

const driftsHeader = css({
  paddingX: '1.5',
  paddingY: '1',
  fontSize: 'xxs',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '[0.04em]',
  color: 'text.dimmed',
})

const driftsList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  maxHeight: '[280px]',
  overflowY: 'auto',
})

const driftsLink = css({
  textDecoration: 'none',
  _hover: { textDecoration: 'none' },
})

const iconColor = css({ color: 'text.warning', fill: 'text.warning' })

const truncate = css({
  minWidth: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

const ProjectDriftsWarning = memo((props: { projectId: ProjectId }) => {
  return (
    <ErrorBoundary fallbackRender={({ error }) => <span>{(error as Error).message}</span>}>
      <Suspense fallback={<span>loading...</span>}>
        <ProjectDriftsWarningLoaded {...props} />
      </Suspense>
    </ErrorBoundary>
  )
})

const ProjectDriftsWarningLoaded = ({ projectId }: { projectId: ProjectId }) => {
  // load model returns stable promise
  const { $likec4model } = use(loadModel(projectId))

  const $hasDrifts = useMemo(
    () => {
      const result = computed(
        $likec4model,
        (model) =>
          model.hasManualLayouts() ?
            pipe(
              model.views(),
              ifilter((v) => v.hasLayoutDrifts),
              imap(v => ({
                id: v.id,
                title: v.titleOrId,
                type: v._type,
              })),
              toArray(),
            ) :
            [],
      )
      result.eq = isDeepEqual
      return result
    },
    [$likec4model],
  )

  const hasDrifts = useStore($hasDrifts)
  if (!hasAtLeast(hasDrifts, 1)) {
    return null
  }
  return (
    <HoverCard
      openDelay={250}
      closeDelay={120}
      position="bottom-start"
      floatingStrategy="fixed"
      shadow="md"
      withinPortal>
      <HoverCard.Target>
        <styled.div className={styles.detail}>
          <IconAlertTriangleFilled size={14} aria-hidden className={iconColor} />
          <styled.span className={iconColor}>
            {hasDrifts.length} view{hasDrifts.length === 1 ? '' : 's'} drifted
          </styled.span>
        </styled.div>
      </HoverCard.Target>
      <HoverCard.Dropdown className={driftsCard}>
        <div className={driftsHeader}>Drifted views</div>
        <div className={driftsList}>
          {hasDrifts.map((view) => (
            <Link
              key={view.id}
              className={cx('group', drifts.button, driftsLink)}
              to="/project/$projectId/view/$viewId/"
              params={{ projectId, viewId: view.id }}>
              <span className={drifts.buttonIcon}>
                <ViewIcon view={view} />
              </span>
              <styled.span css={{ flex: '1', minWidth: '0' }}>
                <div className={cx(drifts.buttonTitle, truncate)} title={view.title}>{view.title}</div>
                {view.title !== view.id && (
                  <div className={cx(drifts.buttonDescription, truncate)}>
                    {view.id}
                  </div>
                )}
              </styled.span>
            </Link>
          ))}
        </div>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
