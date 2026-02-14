import { computeView, withReadableEdges } from '@likec4/core/compute-view';
import { LikeC4Model } from '@likec4/core/model';
const element = ({ id, kind, title }) => ({
    id: id,
    kind,
    title: title ?? id,
    description: null,
    technology: null,
    tags: null,
    links: null,
    style: {},
});
const elements = {
    'A': element({ id: 'A', kind: 'component' }),
    'B': element({ id: 'B', kind: 'component' }),
    'C': element({ id: 'C', kind: 'component' }),
    'D': element({ id: 'D', kind: 'component' }),
    'E': element({ id: 'E', kind: 'component' }),
    'F': element({ id: 'F', kind: 'component' }),
};
const relations = {
    'A:B': {
        id: 'A:B',
        source: { model: 'A' },
        target: { model: 'B' },
        title: '',
    },
    'C:E': {
        id: 'C:E',
        source: { model: 'C' },
        target: { model: 'E' },
        title: '',
    },
    'F:E': {
        id: 'F:E',
        source: { model: 'F' },
        target: { model: 'E' },
        title: '',
    },
};
const rankSnippetView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'rankSnippet',
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
                { ref: { model: 'A' } },
                { ref: { model: 'B' } },
            ],
        },
        {
            rank: 'source',
            targets: [
                { ref: { model: 'C' } },
                { ref: { model: 'D' } },
            ],
        },
        {
            rank: 'max',
            targets: [{ ref: { model: 'F' } }],
        },
        {
            direction: 'TB',
        },
    ],
};
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
};
const rankSnippetModel = LikeC4Model.fromDump(rankSnippetModelDump);
const computed = computeView(rankSnippetView, rankSnippetModel);
if (!computed.isSuccess) {
    throw computed.error;
}
const baseView = withReadableEdges(computed.view);
export const computedRankSnippetView = {
    ...baseView,
    ranks: [
        { type: 'same', nodes: ['A', 'B'] },
        { type: 'source', nodes: ['C', 'D'] },
        { type: 'max', nodes: ['F'] },
    ],
};
