import { defaultTheme } from '@likec4/core/styles'
import { cx } from '@likec4/styles/css'
import { HoverCard, Tooltip } from '@mantine/core'
import { IconArrowUpRight, IconChevronDown, IconFolder, IconUser } from '@tabler/icons-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { type CSSProperties, useState } from 'react'
import {
  type CatalogProject,
  type ProjectLink,
  monogramColor,
  projectInitials,
} from './catalog'
import * as styles from './styles'

const MAX_MINIS = 3
const numberFormat = new Intl.NumberFormat('en-US')

export function formatCount(value: number | null): string {
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
    <span className={styles.monogram} data-size={size} style={monoStyle(projectId)} aria-hidden="true">
      {projectInitials(title)}
    </span>
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
                <span className={styles.monogram} data-size="mini" style={monoStyle(link.projectId)}>
                  {projectInitials(link.title)}
                </span>
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
    <HoverCard
      openDelay={500}
      closeDelay={100}
      position="bottom-start"
      offset={6}
      shadow="md"
      withinPortal>
      <HoverCard.Target>
        <article className={cx('group', styles.card)}>
          <div className={styles.cardHead}>
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
            <div className={styles.detail} data-empty={!project.contactPerson || undefined}>
              <IconUser size={14} aria-hidden />
              <span title={project.contactPerson ?? undefined}>{project.contactPerson ?? 'No contact person'}</span>
            </div>
            <div className={styles.detail} data-empty={!project.path || undefined}>
              <IconFolder size={14} aria-hidden />
              <span title={project.path ?? undefined}>{project.path ?? '—'}</span>
            </div>
          </div>
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
          {expanded && (
            <div className={styles.expandPanel} id={panelId}>
              <DependencyList label="Depends on" empty="No dependencies" links={project.dependsOn} />
              <DependencyList label="Used by" empty="Not used by other projects" links={project.usedBy} />
            </div>
          )}
        </article>
      </HoverCard.Target>
      <HoverCard.Dropdown className={styles.metricsCard}>
        <Metric label="Elements" value={project.elements} />
        <Metric label="Relationships" value={project.relationships} />
        <Metric label="Views" value={project.views} />
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

export function ProjectsCards({ projects }: { projects: ReadonlyArray<CatalogProject> }) {
  return (
    <div className={styles.grid}>
      {projects.map(project => <ProjectCard key={project.id} project={project} />)}
    </div>
  )
}

export function ProjectsTable({ projects }: { projects: ReadonlyArray<CatalogProject> }) {
  const navigate = useNavigate()
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Project</th>
            <th>Id</th>
            <th data-num>Elements</th>
            <th data-num>Relationships</th>
            <th data-num>Views</th>
            <th>Depends on</th>
            <th data-num>Used by</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr
              key={project.id}
              onClick={() => {
                void navigate({ to: '/project/$projectId/', params: { projectId: project.id } })
              }}>
              <td>
                <Link
                  className={styles.nameCell}
                  to="/project/$projectId/"
                  params={{ projectId: project.id }}
                  title={project.title}
                  onClick={e => e.stopPropagation()}>
                  <ProjectMonogram projectId={project.id} title={project.title} size="sm" />
                  <span>{project.title}</span>
                </Link>
              </td>
              <td className={styles.cardSub}>
                {project.id}
              </td>
              <td data-num>{formatCount(project.elements)}</td>
              <td data-num>{formatCount(project.relationships)}</td>
              <td data-num>{formatCount(project.views)}</td>
              <td data-dimmed>{project.dependsOn.map(l => l.title).join(', ') || '—'}</td>
              <td data-num>{project.usedBy.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
