import type { DiagramView } from '@likec4/core'
import { Spotlight, type SpotlightActionGroupData } from '@mantine/spotlight'
import { IconRectangularPrism, IconSitemap, IconSearch } from '@tabler/icons-react'
import { useMemo } from 'react'
import { filter, map, pipe } from 'remeda'
import { useDiagramStoreApi } from './hooks'
import { useLikeC4Model } from './likec4model'

export function LikeC4Search({ view }: { view: DiagramView }) {
  const model = useLikeC4Model(true)
  const store = useDiagramStoreApi()

  const getViewActions = (): SpotlightActionGroupData => {
    const { onNavigateTo } = store.getState()
    const views = model.views()

    return {
      group: 'Views',
      actions: map(views, v => ({
        id: v.id,
        label: v.title ?? v.id,
        keywords: [
          v.id,
          ...(v.tags ?? []),
          ...(v.view.description ? [v.view.description] : [])
        ],
        onClick: () => {
          store.setState({
            hoveredNodeId: null,
            lastOnNavigate: {
              fromView: view.id,
              toView: v.id,
              fromNode: null
            }
          })
          onNavigateTo?.(v.id)
        },
        leftSection: <IconSitemap />
      }))
    }
  }

  const getNodeActions = (): SpotlightActionGroupData => {
    const { focusOnNode } = store.getState()

    return {
      group: 'Elements',
      actions: pipe(
        view.nodes,
        filter(n => !!n.title),
        map(n => ({
          id: n.id,
          label: n.title,
          keywords: [
            n.id,
            ...(n.tags ?? []),
            ...(n.description ? [n.description] : [])
          ],
          onClick: () => focusOnNode(n.id),
          leftSection: <IconRectangularPrism />
        }))
      )
    }
  }

  const actions: SpotlightActionGroupData[] = useMemo(() => [
    getNodeActions(),
    getViewActions()
  ], [model, store, view])

  return (
    <Spotlight
      actions={actions}
      shortcut={['ctrl + f']}
      nothingFound='Nothing found...'
      searchProps={{
        leftSection: <IconSearch />,
        placeholder: 'Search elements in current view and other views...'        
      }}
    >
    </Spotlight>
  )
}
