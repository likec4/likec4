// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import type { DiagramNode, Point } from '../../types'
import { computeRelationshipsView } from './compute'
import { layoutRelationshipsView } from './layout'

function containsPoint(node: DiagramNode, [x, y]: Point) {
  return x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height
}

describe('layoutRelationshipsView', () => {
  const specs = Builder
    .specification({
      elements: {
        el: {},
      },
    })

  it('emits one aggregated edge for multiple displayed relationships between the same nodes', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud').with(
            el('backend'),
          ),
          el('amazon'),
          rel('cloud.backend', 'amazon', 'uses'),
          rel('cloud.backend', 'amazon', 'publishes'),
        )
      )
      .toLikeC4Model()

    const relationshipData = computeRelationshipsView('cloud.backend', model, null)
    const layouted = layoutRelationshipsView(relationshipData)

    expect(layouted.edges).toHaveLength(1)
    const edge = layouted.edges[0]!
    expect(edge).toMatchObject({
      source: 'subject-cloud.backend',
      target: 'out-amazon',
      label: '2 relationships',
    })
    expect(edge.relations).toHaveLength(2)
    expect(edge.points.length).toBeGreaterThan(0)
    expect((edge.points.length - 1) % 3).toBe(0)
  })

  it('keeps edge endpoints inside visible compound node bounds', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('customer'),
          el('cloud').with(
            el('ui').with(
              el('dashboard'),
              el('mobile'),
              el('supportPanel'),
            ),
            el('legacy').with(
              el('backend').with(
                el('services'),
              ),
            ),
            el('next').with(
              el('backend'),
              el('events'),
            ),
          ),
          el('amazon').with(
            el('rds').with(
              el('pg').with(
                el('tblUsers'),
              ),
              el('aurora').with(
                el('tblUsers'),
              ),
            ),
            el('s3').with(
              el('bucket1'),
            ),
            el('sqs').with(
              el('queue1'),
              el('queue2'),
            ),
          ),
          rel('customer', 'cloud.ui.dashboard', 'opens'),
          rel('customer', 'cloud.ui.mobile', 'opens mobile'),
          rel('customer', 'cloud', 'uses'),
          rel('cloud', 'amazon', 'uses'),
          rel('cloud.legacy.backend.services', 'amazon.rds.pg.tblUsers', 'writes'),
          rel('cloud.next.backend', 'amazon.rds.aurora.tblUsers', 'reads'),
          rel('cloud.next.backend', 'amazon.s3.bucket1', 'writes'),
          rel('cloud.next.events', 'amazon.sqs', 'publishes'),
          rel('cloud.next.events', 'amazon.sqs.queue1', 'raw'),
          rel('cloud.next.events', 'amazon.sqs.queue2', 'enriched'),
          rel('cloud.ui.supportPanel', 'amazon.rds.aurora.tblUsers', 'reads'),
        )
      )
      .toLikeC4Model()

    const relations = new Map([...model.relationships()].map(relation => [relation.expression, relation]))
    const relation = (expression: string) => {
      const relationship = relations.get(expression)
      if (!relationship) {
        throw new Error(`Expected relationship ${expression}`)
      }
      return relationship
    }

    const layouted = layoutRelationshipsView({
      incomers: new Set([
        model.element('customer'),
      ]),
      incoming: new Set([
        relation('customer -> cloud.ui.dashboard'),
        relation('customer -> cloud.ui.mobile'),
        relation('customer -> cloud'),
      ]),
      subjects: new Set([
        model.element('cloud'),
        model.element('cloud.ui'),
        model.element('cloud.legacy'),
        model.element('cloud.next'),
        model.element('cloud.ui.dashboard'),
        model.element('cloud.ui.mobile'),
        model.element('cloud.ui.supportPanel'),
        model.element('cloud.legacy.backend.services'),
        model.element('cloud.next.backend'),
        model.element('cloud.next.events'),
      ]),
      outgoing: new Set([
        relation('cloud.legacy.backend.services -> amazon.rds.pg.tblUsers'),
        relation('cloud.next.backend -> amazon.rds.aurora.tblUsers'),
        relation('cloud.next.backend -> amazon.s3.bucket1'),
        relation('cloud.next.events -> amazon.sqs'),
        relation('cloud.next.events -> amazon.sqs.queue1'),
        relation('cloud.next.events -> amazon.sqs.queue2'),
        relation('cloud.ui.supportPanel -> amazon.rds.aurora.tblUsers'),
        relation('cloud -> amazon'),
      ]),
      outgoers: new Set([
        model.element('amazon'),
        model.element('amazon.rds'),
        model.element('amazon.s3'),
        model.element('amazon.sqs'),
        model.element('amazon.rds.pg'),
        model.element('amazon.rds.aurora'),
        model.element('amazon.rds.pg.tblUsers'),
        model.element('amazon.rds.aurora.tblUsers'),
        model.element('amazon.s3.bucket1'),
        model.element('amazon.sqs.queue1'),
        model.element('amazon.sqs.queue2'),
      ]),
    })
    const nodesById = new Map(layouted.nodes.map(node => [node.id, node]))

    for (const edge of layouted.edges) {
      const source = nodesById.get(edge.source)
      const target = nodesById.get(edge.target)
      expect(source, `${edge.id} source node`).toBeDefined()
      expect(target, `${edge.id} target node`).toBeDefined()

      expect(containsPoint(source!, edge.points[0]), `${edge.id} starts inside ${edge.source}`).toBe(true)
      expect(containsPoint(target!, edge.points.at(-1)!), `${edge.id} ends inside ${edge.target}`).toBe(true)
    }

    const subjectCloud = layouted.nodes.find(node => node.id === 'subject-cloud')!
    const incomingToCompound = layouted.edges.find(edge => edge.id === 'in-customer->subject-cloud')!
    const outgoingFromCompound = layouted.edges.find(edge => edge.id === 'subject-cloud->out-amazon')!

    expect(
      incomingToCompound.points.slice(-4).every(([, y]) => y >= subjectCloud.y),
      `${incomingToCompound.id} connects at or below the visible compound top`,
    ).toBe(true)
    expect(
      outgoingFromCompound.points.slice(0, 4).every(([, y]) => y >= subjectCloud.y),
      `${outgoingFromCompound.id} connects at or below the visible compound top`,
    ).toBe(true)
  })
})
