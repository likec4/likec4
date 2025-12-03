import { computeView, withReadableEdges } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import type {
  ComputedElementView,
  Element,
  ElementKind,
  Fqn,
  LikeC4View,
  ModelRelation,
  NodeId,
  RelationId,
  ViewId,
} from '@likec4/core/types'

const element = ({ id, kind, title }: { id: string; kind: ElementKind; title?: string }): Element => ({
  id: id as Fqn,
  kind,
  title: title ?? id,
  description: null,
  technology: null,
  tags: null,
  links: null,
  style: {},
})

const elements = {
  'A': element({ id: 'A', kind: 'component' as ElementKind }),
  'B': element({ id: 'B', kind: 'component' as ElementKind }),
  'C': element({ id: 'C', kind: 'component' as ElementKind }),
  'D': element({ id: 'D', kind: 'component' as ElementKind }),
  'E': element({ id: 'E', kind: 'component' as ElementKind }),
  'F': element({ id: 'F', kind: 'component' as ElementKind }),
} satisfies Record<string, Element>

const relations = {
  'A:B': {
    id: 'A:B' as RelationId,
    source: { model: 'A' as Fqn },
    target: { model: 'B' as Fqn },
    title: '',
  },
  'C:E': {
    id: 'C:E' as RelationId,
    source: { model: 'C' as Fqn },
    target: { model: 'E' as Fqn },
    title: '',
  },
  'F:E': {
    id: 'F:E' as RelationId,
    source: { model: 'F' as Fqn },
    target: { model: 'E' as Fqn },
    title: '',
  },
} satisfies Record<string, ModelRelation>

const rankSnippetView: LikeC4View = {
  _stage: 'parsed',
  _type: 'element',
  id: 'rankSnippet' as ViewId,
  title: 'Effect of Rank',
  description: null,
  tags: null,
  links: null,
  rules: [
    {
      include: [{ wildcard: true }],
    },
    {
      rank: 'same',
      targets: [
        { ref: { model: 'A' as Fqn } },
        { ref: { model: 'B' as Fqn } },
      ],
    },
    {
      rank: 'source',
      targets: [
        { ref: { model: 'C' as Fqn } },
        { ref: { model: 'D' as Fqn } },
      ],
    },
    {
      rank: 'max',
      targets: [{ ref: { model: 'F' as Fqn } }],
    },
    {
      direction: 'TB',
    },
  ],
}

const rankSnippetModelDump = {
  _type: 'computed',
  projectId: 'rank-snippet',
  project: { id: 'rank-snippet' },
  elements,
  relations,
  views: {},
  specification: {
    elements: {
      component: {},
    },
    relationships: {},
    deployments: {},
    tags: {},
  },
  deployments: {
    elements: {},
    relations: {},
  },
  globals: {
    dynamicPredicates: {},
    predicates: {},
    styles: {},
  },
  imports: {},
} as const

const rankSnippetModel = LikeC4Model.fromDump(rankSnippetModelDump)
const computed = computeView(rankSnippetView as any, rankSnippetModel)
if (!computed.isSuccess) {
  throw computed.error
}

const baseView = withReadableEdges(computed.view as ComputedElementView)

export const computedRankSnippetView: ComputedElementView = {
  ...baseView,
  ranks: [
    { type: 'same', nodes: ['A', 'B'] as NodeId[] },
    { type: 'source', nodes: ['C', 'D'] as NodeId[] },
    { type: 'max', nodes: ['F'] as NodeId[] },
  ],
}
