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
      rel('autoscaler', 'worker', 'scales'),
      rel('autoscaler', 'metrics', 'reports to'),
    )
  )
  .views(({ view, $include }, _) =>
    _(
      view('index').with(
        $include('autoscaler'),
        $include('worker'),
      ),
    )
  )
  .toLikeC4Model()

const autoscaler = model.element('autoscaler')
const node = model.view('index').findNodeWithElement('autoscaler')

describe('relationshipsStats', () => {
  it('counts what the current view shows in the view scope', () => {
    expect(relationshipsStats(autoscaler, node, 'view')).toEqual({
      incoming: { total: 0, included: 0 },
      outgoing: { total: 2, included: 1 },
      hidden: 1,
    })
  })

  it('counts every relationship and hides nothing in the global scope', () => {
    expect(relationshipsStats(autoscaler, node, 'global')).toEqual({
      incoming: { total: 0, included: 0 },
      outgoing: { total: 2, included: 2 },
      hidden: 0,
    })
  })

  it('treats every relationship as hidden when the element is not in the current view', () => {
    expect(relationshipsStats(model.element('metrics'), null, 'view')).toEqual({
      incoming: { total: 1, included: 0 },
      outgoing: { total: 0, included: 0 },
      hidden: 1,
    })
  })
})
