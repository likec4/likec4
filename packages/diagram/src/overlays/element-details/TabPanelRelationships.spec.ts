import { Builder } from '@likec4/core/builder'
import { describe, expect, it } from 'vitest'
import { relationshipsStats } from './TabPanelRelationships'

const model = Builder
  .specification({
    elements: {
      system: {},
      service: {},
    },
  })
  .model(({ system, service, rel }, _) =>
    _(
      system('autoscaler'),
      service('worker'),
      system('metrics'),
      system('cloud').with(
        service('db'),
      ),
      rel('autoscaler', 'worker', 'scales'),
      rel('autoscaler', 'metrics', 'reports to'),
      rel('autoscaler', 'cloud.db', 'stores'),
    )
  )
  .views(({ view, $include }, _) =>
    _(
      view('index').with(
        $include('autoscaler'),
        $include('worker'),
        $include('cloud'),
      ),
    )
  )
  .toLikeC4Model()

const view = model.view('index')

describe('relationshipsStats', () => {
  it('counts what the current view shows in the view scope', () => {
    expect(relationshipsStats(model.element('autoscaler'), view, 'view')).toEqual({
      incoming: { total: 0, included: 0 },
      outgoing: { total: 3, included: 2 },
      hidden: 1,
    })
  })

  it('counts every relationship and hides nothing in the global scope', () => {
    expect(relationshipsStats(model.element('autoscaler'), view, 'global')).toEqual({
      incoming: { total: 0, included: 0 },
      outgoing: { total: 3, included: 3 },
      hidden: 0,
    })
  })

  it('counts a relationship the view shows on an ancestor edge as included', () => {
    expect(relationshipsStats(model.element('cloud.db'), view, 'view')).toEqual({
      incoming: { total: 1, included: 1 },
      outgoing: { total: 0, included: 0 },
      hidden: 0,
    })
  })

  it('counts a relationship as hidden when no edge in the view carries it', () => {
    expect(relationshipsStats(model.element('metrics'), view, 'view')).toEqual({
      incoming: { total: 1, included: 0 },
      outgoing: { total: 0, included: 0 },
      hidden: 1,
    })
  })
})
