import { Spotlight, type SpotlightActionGroupData } from '@mantine/spotlight'
import { IconRectangle, IconSitemap } from '@tabler/icons-react'
import { map } from 'remeda'
import { useDiagramStoreApi } from './hooks'
import { useLikeC4Model } from './likec4model'

export function LikeC4Search() {
  const model = useLikeC4Model(true)
  const store = useDiagramStoreApi()
  const { view, focusOnNode, onNavigateTo } = store.getState()

  const getViewActions = (): SpotlightActionGroupData => {
    const views = model.views()

    return {
      group: 'Views',
      actions: map(views, v => ({
        id: v.id,
        label: `${v.title ?? v.id}`,
        keywords: [v.id, ...(v.tags ?? []), ...(v.view.description ? [v.view.description] : [])],
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

  const getNodeActions = (): SpotlightActionGroupData => ({
    group: 'Elements',
    actions: map(view.nodes, n => ({
      id: n.id,
      label: `${n.title}`,
      keywords: [n.id, ...(n.tags ?? []), ...(n.description ? [n.description] : [])],
      onClick: () => focusOnNode(n.id),
      leftSection: <IconRectangle />
    }))
  })

  const actions: SpotlightActionGroupData[] = [
    getNodeActions(),
    getViewActions()
  ]

  return <Spotlight actions={actions} shortcut={['ctrl + f']}></Spotlight>
}
