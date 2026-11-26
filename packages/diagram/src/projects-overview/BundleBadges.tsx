import { css } from '@likec4/styles/css'
import { Stack, Text, Tooltip } from '@mantine/core'
import { useStore, ViewportPortal } from '@xyflow/react'
import { ZIndexes } from '../base/const'
import type { ProjectsOverviewSnapshot } from './actor'
import { useProjectsOverviewActor } from './context'
import type { OverviewBundle } from './derive'
import { useProjectsOverviewState } from './hooks'

const selectBundles = (state: ProjectsOverviewSnapshot) => ({
  bundles: state.context.bundles,
  highlight: state.context.filter.highlight,
})

const badge = css({
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  minWidth: '[24px]',
  height: '[24px]',
  px: '1.5',
  borderRadius: '[999px]',
  borderWidth: '[2px]',
  borderStyle: 'solid',
  borderColor: 'border.default',
  background: 'surface.default',
  color: 'text',
  fontSize: 'xs',
  fontWeight: 'bold',
  lineHeight: '[20px]',
  textAlign: 'center',
  '&[data-active]': {
    borderColor: 'text',
  },
})

/**
 * Badges with the edge count of each frame-to-frame bundle.
 * Click a badge to highlight its edges. Hover to list the project pairs.
 */
export function BundleBadges() {
  const actor = useProjectsOverviewActor()
  const { bundles, highlight } = useProjectsOverviewState(selectBundles)
  const inverseZoom = 1 / useStore(state => state.transform[2])

  return (
    <ViewportPortal>
      {bundles.filter(bundle => !bundle.hidden).map(bundle => {
        const active = highlight?.kind === 'bundle' && highlight.key === bundle.key
        return (
          <Tooltip
            key={bundle.key}
            withArrow
            multiline
            w={320}
            position="top"
            openDelay={150}
            label={<BundleProjects bundle={bundle} />}
          >
            <button
              type="button"
              className={badge}
              data-active={active || undefined}
              aria-label={`${bundle.frameTitles.join(' and ')}: ${bundle.edgeIds.length} edges`}
              style={{
                left: bundle.position.x,
                top: bundle.position.y,
                transform: `translate(-50%, -50%) scale(${inverseZoom})`,
                zIndex: ZIndexes.Max,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                actor.send(
                  active
                    ? { type: 'highlight.clear' }
                    : { type: 'highlight.set', highlight: { kind: 'bundle', key: bundle.key } },
                )
              }}
            >
              {bundle.edgeIds.length}
            </button>
          </Tooltip>
        )
      })}
    </ViewportPortal>
  )
}

export function BundleProjects({ bundle }: { bundle: OverviewBundle }) {
  return (
    <Stack gap={2}>
      {bundle.projects.map(project => <Text key={project} size="xs">{project}</Text>)}
    </Stack>
  )
}
