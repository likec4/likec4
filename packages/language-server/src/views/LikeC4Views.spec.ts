// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LayoutedView, NodeId, ViewId } from '@likec4/core'
import { deepEqual } from 'fast-equals'
import { indexBy } from 'remeda'
import { afterEach, describe, vi } from 'vitest'
import { testFileScope as it } from '../test'

describe('LikeC4Views', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('diagrams returns cached result', async ({ expect, t }) => {
    await t.validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include *
        }
      }
    `)
    const diagrams1 = await t.services.likec4.Views.diagrams()
    const diagrams2 = await t.services.likec4.Views.diagrams()
    expect(diagrams2 !== diagrams1).toBe(true)
    expect(deepEqual(diagrams1, diagrams2)).toBe(true)
  })

  it('diagrams returns cached result if there are no changes', async ({ expect, t }) => {
    await t.parse(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2 {
          component sys22 {
            -> sys1
          }
        }
      }
      views {
        view index {
          include *
        }
        view sys2 of sys2 {
          include *
        }
      }
    `)

    const first = await t.validateAll()
    expect(first.errors).toHaveLength(0)

    const diagrams1 = await t.services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))
    // add model
    await t.parse(`
      model {
        component sys3
      }
    `)

    const second = await t.validateAll()
    expect(second.errors).toHaveLength(0)

    const diagrams2 = await t.services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))

    // index view has changed
    expect(diagrams1.index).not.toStrictEqual(diagrams2.index)
    // expect that sys2 view is the same
    expect(diagrams1.sys2).toStrictEqual(diagrams2.sys2)
  })

  it('layoutedModel preserves manual layout snapshots', async ({ expect, t }) => {
    await t.validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include *
        }
      }
    `)

    const autoDiagram = await t.services.likec4.Views.diagrams().then(diagrams => diagrams[0])
    expect(autoDiagram).toBeDefined()

    const manualDiagram: LayoutedView = {
      ...autoDiagram!,
      _layout: 'manual',
      nodes: autoDiagram!.nodes.map(node =>
        node.id === 'sys1'
          ? {
            ...node,
            x: 1000,
            y: 2000,
          }
          : node
      ),
    }
    const viewId = manualDiagram.id as ViewId

    const manualLayouts = t.services.shared.workspace.ManualLayouts
    vi.spyOn(manualLayouts, 'read').mockResolvedValue({
      hash: 'manual-layout-hash',
      views: {
        [viewId]: manualDiagram,
      },
    })
    t.services.shared.workspace.WorkspaceManager.forceCleanCaches()

    const layoutedModel = await t.services.likec4.LanguageServices.layoutedModel()
    const viewData = layoutedModel.$data.views[viewId]
    if (!viewData) {
      throw new Error(`Expected view data for ${viewId}`)
    }
    const view = layoutedModel.view('index').$view
    const firstNode = view.nodes.find(node => node.id === 'sys1' as NodeId)

    expect(layoutedModel.findManualLayout('index')).toEqual(manualDiagram)
    expect(layoutedModel.$data.manualLayouts?.[viewId]).toEqual(manualDiagram)
    expect(Object.hasOwn(viewData, 'drifts')).toBe(true)
    expect(viewData.drifts).toBeNull()
    expect(view._layout).toBe('manual')
    expect(firstNode).toMatchObject({
      x: 1000,
      y: 2000,
    })
  })

  it('layoutedModel preserves applied manual layout drift reasons', async ({ expect, t }) => {
    await t.validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include *
        }
      }
    `)

    const autoDiagram = await t.services.likec4.Views.diagrams().then(diagrams => diagrams[0])
    expect(autoDiagram).toBeDefined()

    const manualDiagram: LayoutedView = {
      ...autoDiagram!,
      _layout: 'manual',
      drifts: ['nodes-drift'],
    }
    const viewId = manualDiagram.id as ViewId

    const manualLayouts = t.services.shared.workspace.ManualLayouts
    vi.spyOn(manualLayouts, 'read').mockResolvedValue({
      hash: 'manual-layout-hash',
      views: {
        [viewId]: manualDiagram,
      },
    })
    t.services.shared.workspace.WorkspaceManager.forceCleanCaches()
    vi.spyOn(t.services.likec4.Views, 'diagrams').mockResolvedValue([manualDiagram])

    const layoutedModel = await t.services.likec4.LanguageServices.layoutedModel()
    const viewData = layoutedModel.$data.views[viewId]

    expect(viewData).toEqual(manualDiagram)
  })

  it('layoutedModel keeps auto views when another view has manual layout', async ({ expect, t }) => {
    await t.validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2 {
          component sys21
        }
        sys1 -> sys2.sys21
      }
      views {
        view index {
          include *
        }
        view sys2 of sys2 {
          include *
        }
      }
    `)

    const diagrams = await t.services.likec4.Views.diagrams().then(d => indexBy(d, v => v.id as 'index' | 'sys2'))
    const indexDiagram = diagrams.index
    if (!indexDiagram) {
      throw new Error('Expected index diagram')
    }
    const manualDiagram: LayoutedView = {
      ...indexDiagram,
      _layout: 'manual',
      nodes: indexDiagram.nodes.map(node =>
        node.id === 'sys1'
          ? {
            ...node,
            x: 1000,
            y: 2000,
          }
          : node
      ),
    }
    const viewId = manualDiagram.id as ViewId

    const manualLayouts = t.services.shared.workspace.ManualLayouts
    vi.spyOn(manualLayouts, 'read').mockResolvedValue({
      hash: 'manual-layout-hash',
      views: {
        [viewId]: manualDiagram,
      },
    })
    t.services.shared.workspace.WorkspaceManager.forceCleanCaches()

    const layoutedModel = await t.services.likec4.LanguageServices.layoutedModel()
    const views = layoutedModel.$data.views
    const manualView = views['index']
    const autoView = views['sys2']
    if (!manualView) {
      throw new Error('Expected manual index view')
    }
    if (!autoView) {
      throw new Error('Expected auto sys2 view')
    }

    expect(Object.keys(views)).toEqual(expect.arrayContaining(['index', 'sys2']))
    expect(manualView._layout).toBe('manual')
    expect(manualView.nodes.find(node => node.id === 'sys1')).toMatchObject({
      x: 1000,
      y: 2000,
    })
    expect(autoView._layout).not.toBe('manual')
  })
})
