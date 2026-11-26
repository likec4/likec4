import type { ProjectId } from '@likec4/core/types'
import { styled } from '@likec4/styles/jsx'
import { HoverCard, Tooltip } from '@mantine/core'
import { IconFolder, IconUser } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Card,
  CardBody,
  CardFoot,
  CardGrid,
  CardHead,
  CardOpenIndicator,
  CardPanel,
  CardSubtitle,
  CardTitle,
  CardTitles,
  ExpandButton,
} from '../ui/Card'
import { Detail, DetailButton } from '../ui/Detail'
import { Metric, MetricsGrid } from '../ui/Metric'
import { MonogramMore, MonogramStack } from '../ui/Monogram'
import { EmptyNote, FieldLabel } from '../ui/Text'
import type { CatalogProject, ProjectLink } from './catalog'
import { ProjectDrifts } from './ProjectDrifts'
import { ProjectMonogram } from './ProjectMonogram'

const MAX_MINIS = 3

export interface ProjectsCardsProps {
  projects: ReadonlyArray<CatalogProject>
  /**
   * Opens the project config in the editor; the path is plain text without it
   */
  onOpenSource?: ((projectId: ProjectId) => void) | undefined
}

export function ProjectsCards({ projects, onOpenSource }: ProjectsCardsProps) {
  return (
    <CardGrid equalHeight>
      {projects.map(project => <ProjectCard key={project.id} project={project} onOpenSource={onOpenSource} />)}
    </CardGrid>
  )
}

function ProjectCard({ project, onOpenSource }: {
  project: CatalogProject
  onOpenSource: ((projectId: ProjectId) => void) | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const panelId = `project-deps-${project.id}`
  return (
    <Card>
      <CardHead>
        <ProjectMonogram project={project} size="lg" aria-hidden />
        <CardTitles>
          <CardTitle>
            <Link to="/project/$projectId/" params={{ projectId: project.id }} title={project.title}>
              {project.title}
            </Link>
          </CardTitle>
          <CardSubtitle>{project.id}</CardSubtitle>
        </CardTitles>
        <CardOpenIndicator />
      </CardHead>
      <CardBody>
        {project.contactPerson && (
          <Detail>
            <IconUser size={14} aria-hidden />
            <span title={project.contactPerson}>{project.contactPerson}</span>
          </Detail>
        )}
        {onOpenSource
          ? (
            <DetailButton
              type="button"
              dimmed={!project.path}
              title="Open project config in editor"
              onClick={() => onOpenSource(project.id)}>
              <IconFolder size={14} aria-hidden />
              <span>{project.path ?? '—'}</span>
            </DetailButton>
          )
          : (
            <Detail dimmed={!project.path}>
              <IconFolder size={14} aria-hidden />
              <span title={project.path ?? undefined}>{project.path ?? '—'}</span>
            </Detail>
          )}
        {project.views !== null && <ProjectDrifts projectId={project.id} />}
      </CardBody>
      <HoverCard
        openDelay={600}
        closeDelay={100}
        position="bottom-start"
        offset={6}
        shadow="md"
        withinPortal>
        <HoverCard.Target>
          <CardFoot>
            <DependencySummary label="Depends on" links={project.dependsOn} />
            <DependencySummary label="Used by" links={project.usedBy} />
            <ExpandButton
              expanded={expanded}
              aria-controls={panelId}
              aria-label={`${expanded ? 'Hide' : 'Show'} dependencies of ${project.title}`}
              onClick={() => setExpanded(v => !v)} />
          </CardFoot>
        </HoverCard.Target>
        <HoverCard.Dropdown p={0}>
          <MetricsGrid>
            <Metric label="Elements" value={project.elements} />
            <Metric label="Relationships" value={project.relationships} />
            <Metric label="Views" value={project.views} />
          </MetricsGrid>
        </HoverCard.Dropdown>
      </HoverCard>
      {expanded && (
        <CardPanel id={panelId}>
          <DependencyList label="Depends on" empty="No dependencies" links={project.dependsOn} />
          <DependencyList label="Used by" empty="Not used by other projects" links={project.usedBy} />
        </CardPanel>
      )}
    </Card>
  )
}

function relationshipsLabel(count: number): string {
  return `${count} relationship${count === 1 ? '' : 's'}`
}

/**
 * Label and a stack of mini monograms, in the card footer
 */
function DependencySummary({ label, links }: { label: string; links: ReadonlyArray<ProjectLink> }) {
  const shown = links.slice(0, MAX_MINIS)
  const hidden = links.slice(MAX_MINIS)
  const names = links.map(l => l.title).join(', ')
  return (
    <Summary role="group" aria-label={`${label}: ${names || 'none'}`}>
      <FieldLabel aria-hidden="true">{label}</FieldLabel>
      {links.length === 0
        ? <EmptyNote aria-hidden="true">—</EmptyNote>
        : (
          <MonogramStack aria-hidden="true">
            {shown.map(link => (
              <Tooltip
                key={link.projectId}
                label={`${link.title} · ${relationshipsLabel(link.relationships)}`}
                withArrow>
                <ProjectMonogram projectId={link.projectId} title={link.title} size="mini" />
              </Tooltip>
            ))}
            {hidden.length > 0 && (
              <Tooltip
                label={hidden.map(l => `${l.title} · ${l.relationships}`).join(', ')}
                withArrow
                multiline
                maw={260}>
                <MonogramMore>+{hidden.length}</MonogramMore>
              </Tooltip>
            )}
          </MonogramStack>
        )}
    </Summary>
  )
}

const Summary = styled('div', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    minWidth: '0',
  },
})

/**
 * Linked projects with relationship counts, in the expanded panel
 */
function DependencyList({ label, empty, links }: {
  label: string
  empty: string
  links: ReadonlyArray<ProjectLink>
}) {
  return (
    <List>
      <FieldLabel>{label}</FieldLabel>
      {links.length === 0 && <EmptyNote>{empty}</EmptyNote>}
      {links.map(link => (
        <Link key={link.projectId} to="/project/$projectId/" params={{ projectId: link.projectId }}>
          <ProjectMonogram projectId={link.projectId} title={link.title} size="mini" />
          <span>{link.title}</span>
          <span>{link.relationships} rel</span>
        </Link>
      ))}
    </List>
  )
}

const List = styled('div', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5',
    '& > span:first-child': {
      marginBottom: '1',
    },
    '& > a': {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      height: '[30px]',
      paddingX: '1.5',
      borderRadius: 'sm',
      fontSize: 'sm',
      color: 'text',
      textDecoration: 'none',
      _hover: {
        backgroundColor: 'surface.sunken.hover',
      },
    },
    '& > a > span:nth-child(2)': {
      flex: '1',
      minWidth: '0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& > a > span:last-child': {
      fontFamily: 'body',
      fontSize: 'xs',
      fontVariantNumeric: 'tabular-nums',
      color: 'text.dimmed',
    },
  },
})
