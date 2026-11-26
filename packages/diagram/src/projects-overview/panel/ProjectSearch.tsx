import { Button, Stack, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import type { ProjectsOverviewTypes } from '../_types'
import { useProjectsOverviewActor } from '../context'

const MaxResults = 8

/**
 * Finds visible projects by title. Picking a result highlights it and fits it on screen.
 */
export function ProjectSearch({ nodes }: { nodes: ReadonlyArray<ProjectsOverviewTypes.Node> }) {
  const actor = useProjectsOverviewActor()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const results = needle === ''
    ? []
    : nodes
      .filter((node): node is ProjectsOverviewTypes.ProjectNode => node.type === 'project')
      .filter(node => !node.hidden && node.data.title.toLowerCase().includes(needle))
      .slice(0, MaxResults)

  return (
    <Stack gap={4}>
      <TextInput
        size="xs"
        placeholder="Search projects"
        leftSection={<IconSearch size={14} />}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      {results.map(node => (
        <Button
          key={node.id}
          size="compact-xs"
          variant="subtle"
          justify="flex-start"
          onClick={() => actor.send({ type: 'project.focus', nodeId: node.id })}
        >
          {node.data.title}
        </Button>
      ))}
    </Stack>
  )
}
