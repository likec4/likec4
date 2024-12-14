import { rem } from '@mantine/core'
import { Spotlight, type SpotlightActionData } from '@mantine/spotlight'
import { IconRectangularPrism, IconSearch, IconSitemap, IconStack2 } from '@tabler/icons-react'
import { memo, useMemo } from 'react'
import { filter, map, pipe } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps } from './hooks'
import { useLikeC4Model } from './likec4model'
import * as css from './LikeC4Search.css'

export const LikeC4Search = memo(() => {
  const view = useDiagramState(s => s.view)
  const model = useLikeC4Model(true)
  const store = useDiagramStoreApi()

  const getNodeActionsData = (): SpotlightActionData[] => {
    const { focusOnNode } = store.getState()

    return pipe(
      view.nodes,
      filter(n => !!n.title),
      map(n => ({
        id: n.id,
        label: n.title,
        ...(n.description && {
          description: n.description
        }),
        keywords: [
          n.title,
          ...(n.tags ?? []).map(t => `#${t}`),
          ...(n.description ? [n.description] : [])
        ].filter(k => k.toLowerCase()),
        onClick: () => focusOnNode(n.id),
        leftSection: <IconRectangularPrism />
      }))
    )
  }

  const getViewActionsData = (): SpotlightActionData[] => {
    const views = [...model.views()]

    return map(views, v => ({
      id: v.id,
      label: v.title ?? v.id,
      ...(v.$view.description && {
        description: v.$view.description
      }),
      keywords: [
        v.title ?? v.id,
        ...(v.tags ?? []),
        ...(v.$view.description ? [v.$view.description] : [])
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
      leftSection: v.isDeploymentView()
        ? <IconStack2 />
        : <IconSitemap />
    }))
  }

  const actions = useMemo(() => [
    {
      group: 'Elements',
      actions: getNodeActionsData()
    },
    {
      group: 'Views',
      actions: getViewActionsData()
    }
  ], [model, store, view])

  const portalProps = useMantinePortalProps()
  return (
    <Spotlight
      {...portalProps}
      actions={actions}
      nothingFound="Nothing found..."
      shortcut={['mod + f', 'mod + k']}
      scrollable
      highlightQuery
      maxHeight={350}
      classNames={{
        actionSection: css.actionSection
      }}
      searchProps={{
        leftSection: <IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />,
        placeholder: 'Search elements and views...'
      }}
    />
  )
})
