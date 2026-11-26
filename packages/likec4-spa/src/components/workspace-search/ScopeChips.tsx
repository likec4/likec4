import type { ProjectId } from '@likec4/core/types'
import { byId } from '@likec4/core/utils'
import { styled } from '@likec4/styles/jsx'
import { Count, Truncate } from '../ui/Text'
import { ProjectMonogram } from '../workspace-overview/ProjectMonogram'
import type { SearchResult } from './search-index'
import type { WorkspaceIndex } from './search-index'
import { SearchPanel } from './SearchPanel'

/**
 * Chips that limit the search to a project, with the number of matches in each
 */
export function ScopeChips({ result, scope, indexProjects, onScope }: {
  result: SearchResult
  indexProjects: WorkspaceIndex['projects']
  scope: ProjectId | null
  onScope: (id: ProjectId | null) => void
}) {
  // with `@prefix`, offer the matching projects; otherwise projects with matches, most first
  let ids: ReadonlyArray<ProjectId>
  if (result.scopeCandidates) {
    ids = result.scopeCandidates
  } else {
    ids = [...result.counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
    // the picked project stays visible (and pressed), even without matches
    if (scope && !ids.includes(scope)) {
      ids = [...ids, scope]
    }
  }
  const projects = ids.map(id => byId(indexProjects, id) ?? { id, title: id })
  const without = result.scopeCandidates ? 0 : Math.max(0, indexProjects.length - ids.length)
  return (
    // Padding is needed to align with the search input
    // So we set it to 0 to remove the default padding
    <SearchPanel.Tags role="group" aria-label="Limit to project" paddingLeft={'0'}>
      <Chip
        type="button"
        noMonogram
        aria-pressed={scope === null && !result.scopeCandidates}
        onClick={() => onScope(null)}>
        All projects <Count>{result.total}</Count>
      </Chip>
      {projects.map(project => (
        <Chip
          key={project.id}
          type="button"
          aria-pressed={scope === project.id}
          title={project.title}
          onClick={() => onScope(scope === project.id ? null : project.id)}>
          <ProjectMonogram project={project} size="chip" aria-hidden />
          <Truncate>{project.title}</Truncate>
          <Count>{result.counts.get(project.id) ?? 0}</Count>
        </Chip>
      ))}
      {without > 0 && <NoMatches>{without} with no matches</NoMatches>}
    </SearchPanel.Tags>
  )
}

const Chip = styled('button', {
  base: {
    display: 'inline-flex',
    maxWidth: '[240px]',
    alignItems: 'center',
    gap: '1.5',
    height: '[28px]',
    paddingLeft: '[3px]',
    paddingRight: '2',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.default',
    color: 'text',
    fontFamily: 'body',
    fontSize: 'xs',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    _hover: {
      borderColor: 'border.default',
    },
    '&[aria-pressed="true"]': {
      borderColor: 'primary.border',
      backgroundColor: 'primary.body.light',
      color: 'primary.text.light',
    },
    '&[aria-pressed="true"] > span:last-child': {
      color: 'inherit',
    },
  },
  variants: {
    /**
     * "All projects" has no monogram
     */
    noMonogram: {
      true: {
        paddingLeft: '2',
      },
    },
  },
})

const NoMatches = styled('span', {
  base: {
    color: 'text.dimmed',
    fontSize: 'xs',
    paddingX: '1',
  },
})
