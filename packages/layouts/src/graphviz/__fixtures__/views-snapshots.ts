import type { ComputedElementView, ComputedView } from '@likec4/core'

/**
 * @see issue-911.spec.ts from packages/language-server/src/model/__tests__
 */
export const viewIssue911: ComputedElementView = {
  __: 'element',
  autoLayout: 'TB',
  description: null,
  edges: [
    // {
    //   id: 'a1:a2',
    //   label: 'comment included',
    //   parent: null,
    //   relations: [
    //     'l0yrqt'
    //   ],
    //   source: 'a1',
    //   target: 'a2'
    // },
    {
      id: 'b1:b2',
      label: 'comment not included',
      parent: null,
      relations: [
        'y6iwvm'
      ],
      source: 'b1',
      target: 'b2'
    }
  ],
  hash: '7d53d820ca362e8e4e9c8c977de2abac55d597c6',
  id: 'issue911',
  links: null,
  nodes: [
    {
      children: [],
      color: 'primary',
      description: null,
      id: 'a1',
      inEdges: [],
      kind: 'node',
      level: 0,
      links: null,
      outEdges: [
        // 'a1:a2'
      ],
      parent: null,
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'a1'
    },
    {
      children: [],
      color: 'primary',
      description: null,
      id: 'a2',
      inEdges: [
        // 'a1:a2'
      ],
      kind: 'node',
      level: 0,
      links: null,
      outEdges: [],
      parent: null,
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'a2'
    },
    {
      children: [
        'b1.b12',
        'b1.b11'
      ],
      color: 'primary',
      depth: 1,
      description: null,
      id: 'b1',
      inEdges: [],
      kind: 'node',
      level: 0,
      links: null,
      outEdges: [
        'b1:b2'
      ],
      parent: null,
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'b1'
    },
    {
      children: [],
      color: 'primary',
      description: null,
      id: 'b1.b12',
      inEdges: [],
      kind: 'node',
      level: 1,
      links: null,
      outEdges: [],
      parent: 'b1',
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'b12'
    },
    {
      children: [],
      color: 'primary',
      description: null,
      id: 'b1.b11',
      inEdges: [],
      kind: 'node',
      level: 1,
      links: null,
      outEdges: [],
      parent: 'b1',
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'b11'
    },
    {
      children: [
        'b2.b22',
        'b2.b21'
      ],
      color: 'primary',
      depth: 1,
      description: null,
      id: 'b2',
      inEdges: [
        'b1:b2'
      ],
      kind: 'node',
      level: 0,
      links: null,
      outEdges: [],
      parent: null,
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'b2'
    },
    {
      children: [],
      color: 'primary',
      description: null,
      id: 'b2.b22',
      inEdges: [],
      kind: 'node',
      level: 1,
      links: null,
      outEdges: [],
      parent: 'b2',
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'b22'
    },
    {
      children: [],
      color: 'primary',
      description: null,
      id: 'b2.b21',
      inEdges: [],
      kind: 'node',
      level: 1,
      links: null,
      outEdges: [],
      parent: 'b2',
      shape: 'rectangle',
      style: {},
      tags: null,
      technology: null,
      title: 'b21'
    }
  ],
  relativePath: '1.c4',
  tags: null,
  title: 'Landscape view'
} as any
