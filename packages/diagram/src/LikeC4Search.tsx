import { Spotlight, type SpotlightActionGroupData } from '@mantine/spotlight'
import { IconRectangularPrism, IconSearch, IconSitemap } from '@tabler/icons-react'
import { memo, useMemo } from 'react'
import { filter, map, pipe } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps } from './hooks'
import { useLikeC4Model } from './likec4model'

export const LikeC4Search = memo(() => {
  const view = useDiagramState(s => s.view)
  const model = useLikeC4Model(true)
  const store = useDiagramStoreApi()
  const portalProps = useMantinePortalProps()

  const getViewActions = (): SpotlightActionGroupData => {
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
          store.getState().onNavigateTo?.(v.id)
        },
        leftSection: <IconSitemap />
      }))
    }
  }

  const getNodeActions = (): SpotlightActionGroupData => {
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
          onClick: () => store.getState().focusOnNode(n.id),
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
      {...portalProps}
      actions={actions}
      shortcut={['mod + f', 'mod + k']}
      nothingFound='Nothing found...'
      scrollable
      maxHeight={'calc(100vh - 100px)'}
      searchProps={{
        leftSection: <IconSearch />,
        placeholder: 'Search elements in current view and other views...'
      }}
    >
    </Spotlight>
  )
})
