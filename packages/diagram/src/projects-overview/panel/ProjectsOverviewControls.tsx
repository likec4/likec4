import { css } from '@likec4/styles/css'
import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useEffect } from 'react'
import type { ProjectsOverviewSnapshot } from '../actor'
import { useProjectsOverviewActor } from '../context'
import type { ProjectsOverviewExportFormat, ProjectsOverviewExports } from '../exports'
import { useProjectsOverviewState, useProjectsOverviewXYFlow, useProjectsOverviewXYStoreApi } from '../hooks'
import { BundleList } from './BundleList'
import { ColorLegend } from './ColorLegend'
import { downloadText, exportOverviewAsImage } from './exportImage'
import { ExportMenu } from './ExportMenu'
import { FrameFilter } from './FrameFilter'
import { ProjectSearch } from './ProjectSearch'

const FILENAME = 'projects-overview'

const selectControls = (state: ProjectsOverviewSnapshot) => ({
  view: state.context.view,
  filter: state.context.filter,
  bundles: state.context.bundles,
  nodes: state.context.xynodes,
})

const panel = css({
  position: 'absolute',
  top: '4',
  right: '4',
  zIndex: 'panel',
  width: '[300px]',
  maxHeight: '[calc(100% - 32px)]',
  overflowY: 'auto',
})

const section = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
})

/**
 * Side panel with the reader's controls: frames, search, edge bundles, legend, reset and export.
 */
export function ProjectsOverviewControls({ exports }: { exports: ProjectsOverviewExports }) {
  const actor = useProjectsOverviewActor()
  const xystore = useProjectsOverviewXYStoreApi()
  const xyflow = useProjectsOverviewXYFlow()
  const { view, filter, bundles, nodes } = useProjectsOverviewState(selectControls)

  const focusedFrame = filter.focusFrame === null
    ? null
    : nodes.find(node => node.id === filter.focusFrame)
  const hasHighlight = filter.highlight !== null

  const onExport = (format: ProjectsOverviewExportFormat) => {
    switch (format) {
      case 'png':
      case 'jpg': {
        const viewport = xystore.getState().domNode?.querySelector<HTMLElement>('.react-flow__viewport')
        if (viewport) {
          void exportOverviewAsImage({
            viewport,
            bounds: xyflow.getNodesBounds(nodes.filter(node => !node.hidden)),
            format: format === 'jpg' ? 'jpeg' : 'png',
            filename: FILENAME,
          })
        }
        return
      }
      case 'drawio': {
        if (exports.drawioEditUrl) {
          window.open(exports.drawioEditUrl, '_blank', 'noopener,noreferrer')
        }
        return
      }
      default: {
        const source = exports[format]
        if (source) {
          downloadText(source, `${FILENAME}.${format}`)
        }
      }
    }
  }

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      if (hasHighlight) {
        actor.send({ type: 'highlight.clear' })
      } else if (filter.focusFrame !== null) {
        actor.send({ type: 'frame.back' })
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [actor, hasHighlight, filter.focusFrame])

  return (
    <Paper shadow="md" withBorder p="sm" radius="md" className={panel}>
      <Stack gap="md">
        {focusedFrame && (
          <Group justify="space-between" wrap="nowrap">
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconArrowLeft size={14} />}
              onClick={() => actor.send({ type: 'frame.back' })}
            >
              All projects
            </Button>
            <Text size="xs" fw={600} truncate>{focusedFrame.data.title}</Text>
          </Group>
        )}
        <ProjectSearch nodes={nodes} />
        <div className={section}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">Frames</Text>
          <FrameFilter nodes={nodes} hiddenGroups={filter.hiddenGroups} />
        </div>
        <div className={section}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">Edge bundles</Text>
          <BundleList bundles={bundles} highlight={filter.highlight} />
        </div>
        {view.legend && (
          <div className={section}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Legend</Text>
            <ColorLegend legend={view.legend} />
          </div>
        )}
        <Group gap="xs">
          <Button size="xs" variant="default" onClick={() => actor.send({ type: 'group.showAll' })}>
            Reset
          </Button>
          <ExportMenu exports={exports} onExport={onExport} />
        </Group>
      </Stack>
    </Paper>
  )
}
