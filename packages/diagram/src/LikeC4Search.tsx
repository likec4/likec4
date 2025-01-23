import { rem } from '@mantine/core'
import { type SpotlightActionData, Spotlight } from '@mantine/spotlight'
import { IconRectangularPrism, IconSearch, IconSitemap, IconStack2 } from '@tabler/icons-react'
import { memo, useMemo } from 'react'
import { filter, map, pipe } from 'remeda'
import { useMantinePortalProps } from './hooks'
import { useDiagram, useDiagramContext } from './hooks2'
import { useLikeC4Model } from './likec4model'
import * as css from './LikeC4Search.css'

export const LikeC4Search = memo(() => {
  const view = useDiagramContext(s => s.view)
  const model = useLikeC4Model(true)
  const diagram = useDiagram()

  const getNodeActionsData = (): SpotlightActionData[] => {
    return pipe(
      view.nodes,
      filter(n => !!n.title),
      map(n => ({
        id: n.id,
        label: n.title,
        ...(n.description && {
          description: n.description,
        }),
        keywords: [
          n.title,
          ...(n.tags ?? []).map(t => `#${t}`),
          ...(n.description ? [n.description] : []),
        ].filter(k => k.toLowerCase()),
        onClick: () => diagram.focusNode(n.id),
        leftSection: <IconRectangularPrism />,
      })),
    )
  }

  const getViewActionsData = (): SpotlightActionData[] => {
    const views = [...model.views()]

    return map(views, v => ({
      id: v.id,
      label: v.title ?? v.id,
      ...(v.$view.description && {
        description: v.$view.description,
      }),
      keywords: [
        v.title ?? v.id,
        ...(v.tags ?? []),
        ...(v.$view.description ? [v.$view.description] : []),
      ],
      onClick: () => {
        diagram.navigateTo(v.id)
      },
      leftSection: v.isDeploymentView()
        ? <IconStack2 />
        : <IconSitemap />,
    }))
  }

  const actions = useMemo(() => [
    {
      group: 'Elements',
      actions: getNodeActionsData(),
    },
    {
      group: 'Views',
      actions: getViewActionsData(),
    },
  ], [model, diagram, view])

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
        actionSection: css.actionSection,
      }}
      searchProps={{
        leftSection: <IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />,
        placeholder: 'Search elements and views...',
      }}
    />
  )
})
