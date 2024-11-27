import { Center, Group, Highlight, Text } from '@mantine/core'
import { Spotlight, type SpotlightActionData, SpotlightActionsGroup } from '@mantine/spotlight'
import { IconRectangularPrism, IconSearch, IconSitemap } from '@tabler/icons-react'
import { memo, useMemo, useState } from 'react'
import { filter, map, pipe } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps } from './hooks'
import { useLikeC4Model } from './likec4model'

interface QueryMatch {
  data: SpotlightActionData
  keyword: string
  match: string
}

function filterAction(actionData: SpotlightActionData, query: string): QueryMatch | undefined {
  const queryLower = query.toLowerCase()
  const keywords = Array.isArray(actionData.keywords) ? actionData.keywords : []
  const keywordMatch = keywords
    .map(keyword => {
      const index = keyword.toLowerCase().indexOf(queryLower)
      return index !== -1
        ? {
          keyword: keyword,
          match: keyword.substring(index, index + query.length)
        }
        : null
    })
    .find(match => !!match)
  return !!keywordMatch
    ? {
      data: actionData,
      keyword: keywordMatch.keyword,
      match: keywordMatch.match
    }
    : undefined
}

function buildFilteredActions(actionsData: SpotlightActionData[], query: string): JSX.Element[] {
  return pipe(
    actionsData,
    map(a => filterAction(a, query)),
    filter(qm => !!qm),
    map(qm => buildSpotlightAction(qm))
  )
}

function highlightMatch(match: QueryMatch): JSX.Element {
  return <Highlight highlight={match.match}>{match.keyword}</Highlight>
}

function buildSpotlightAction(matchedAction: QueryMatch): JSX.Element {
  const isMatchInLabel = matchedAction.keyword == matchedAction.data.label
  return (
    <Spotlight.Action onClick={matchedAction.data.onClick}>
      <Center style={{ marginRight: '8px ' }}>
        {matchedAction.data.leftSection}
      </Center>
      <Group wrap="nowrap" w="100%">
        <div style={{ flex: 1 }}>
          <Text>
            {isMatchInLabel ? highlightMatch(matchedAction) : matchedAction.data.label}
          </Text>
          {!isMatchInLabel && <Text opacity={0.6} size="xs">{highlightMatch(matchedAction)}</Text>}
        </div>
      </Group>
    </Spotlight.Action>
  )
}

export const LikeC4Search = memo(() => {
  const view = useDiagramState(s => s.view)
  const model = useLikeC4Model(true)
  const store = useDiagramStoreApi()
  const [query, setQuery] = useState('')

  const getNodeActionsData = (): SpotlightActionData[] => {
    const { focusOnNode } = store.getState()

    return pipe(
      view.nodes,
      filter(n => !!n.title),
      map(n => ({
        id: n.id,
        label: n.title,
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
    const { onNavigateTo } = store.getState()
    const views = model.views().toArray()

    return map(views, v => ({
      id: v.id,
      label: v.title ?? v.id,
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
        onNavigateTo?.(v.id)
      },
      leftSection: <IconSitemap />
    }))
  }

  const { nodeActions, viewActions } = useMemo(() => ({
    nodeActions: buildFilteredActions(getNodeActionsData(), query),
    viewActions: buildFilteredActions(getViewActionsData(), query)
  }), [model, store, view, query])

  const portalProps = useMantinePortalProps()
  return (
    <Spotlight.Root
      {...portalProps}
      shortcut={['mod + f', 'mod + k']}
      query={query}
      onQueryChange={setQuery}
      scrollable
      maxHeight={'calc(100vh - 100px)'}
    >
      <Spotlight.Search
        placeholder="Search elements in current view and other views..."
        leftSection={<IconSearch stroke={1.5} />}
      />
      <Spotlight.ActionsList>
        {nodeActions.length > 0 && <SpotlightActionsGroup label="Elements">{nodeActions}</SpotlightActionsGroup>}
        {viewActions.length > 0 && <SpotlightActionsGroup label="Views">{viewActions}</SpotlightActionsGroup>}
        {nodeActions.length == 0 && viewActions.length == 0 && <Spotlight.Empty>Nothing found...</Spotlight.Empty>}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  )
})
