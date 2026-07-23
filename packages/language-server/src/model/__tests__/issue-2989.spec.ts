// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant, isDynamicView, isElementView, ProjectId, stepGuards, ViewId } from '@likec4/core'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../../test'

const importedRoot = '@contrat.entreprise'
const importedBackend = '@contrat.entreprise.refonteExtranetEntrepriseBack'
const localService = 'hermesPrevoyance.noyau_wsedimachine'

function projects(hermesSource: string): ReturnType<typeof createMultiProjectTestServices> {
  return createMultiProjectTestServices({
    contrat: {
      'model.c4': `
        specification {
          element system
          element backend
          element service
          relationship async {
            technology 'Async channel'
          }
        }
        model {
          entreprise = system 'Entreprise' {
            refonteExtranetEntrepriseBack = backend 'Back'
          }
        }
      `,
    },
    hermes: {
      'model.c4': `
        specification {
          element system
          element backend
          element service
          relationship async {
            technology 'Async channel'
          }
        }
        import { entreprise } from 'contrat'
        model {
          hermesPrevoyance = system 'Hermes' {
            noyau_wsedimachine = service 'WS EDI Machine'
          }
        }
        views {
          ${hermesSource}
        }
      `,
    },
  })
}

describe('issue #2989', () => {
  it('preserves project id in scoped element views that reference imported elements', async ({ expect }) => {
    await using t = await projects(`
      view local_scope of hermesPrevoyance.noyau_wsedimachine {
        include *
      }

      view imported_root_scope of entreprise {
        include *
      }

      view imported_nested_scope of entreprise.refonteExtranetEntrepriseBack {
        include *
      }
    `)

    await t.validateAll()
    const parsed = await t.services.likec4.ModelBuilder.parseModel(ProjectId('hermes'))
    invariant(parsed)

    const localView = parsed.$data.views[ViewId('local_scope')]
    invariant(localView)
    invariant(isElementView(localView))
    expect(localView.viewOf).toBe(localService)

    const rootView = parsed.$data.views[ViewId('imported_root_scope')]
    invariant(rootView)
    invariant(isElementView(rootView))
    expect(rootView.viewOf).toBe(importedRoot)

    const nestedView = parsed.$data.views[ViewId('imported_nested_scope')]
    invariant(nestedView)
    invariant(isElementView(nestedView))
    expect(nestedView.viewOf).toBe(importedBackend)

    // This proves `viewOf` parsing registered both imported targets, not only the explicit import alias.
    expect(parsed.$data.imports['contrat']?.map(e => e.id)).toEqual(expect.arrayContaining([
      'entreprise',
      'entreprise.refonteExtranetEntrepriseBack',
    ]))
  })

  it('computes scoped element views that reference imported nested elements', async ({ expect }) => {
    await using t = await projects(`
      view local_scope of hermesPrevoyance.noyau_wsedimachine {
        include *
      }

      view imported_root_scope of entreprise {
        include *
      }

      view imported_nested_scope of entreprise.refonteExtranetEntrepriseBack {
        include *
      }
    `)

    const model = await t.buildModel('hermes')
    const localView = model.views[ViewId('local_scope')]
    invariant(localView)
    invariant(isElementView(localView))
    expect(localView.viewOf).toBe(localService)
    expect(localView.nodes.map(n => n.id)).toEqual(expect.arrayContaining([
      localService,
    ]))

    const rootView = model.views[ViewId('imported_root_scope')]
    invariant(rootView)
    invariant(isElementView(rootView))
    expect(rootView.viewOf).toBe(importedRoot)
    expect(rootView.nodes.map(n => n.id)).toEqual(expect.arrayContaining([
      importedRoot,
      importedBackend,
    ]))

    const nestedView = model.views[ViewId('imported_nested_scope')]
    invariant(nestedView)
    invariant(isElementView(nestedView))
    expect(nestedView.viewOf).toBe(importedBackend)
    expect(nestedView.nodes.map(n => n.id)).toEqual(expect.arrayContaining([
      importedBackend,
    ]))
  })

  it('computes imported root scoped wildcard views with descendants and default title', async ({ expect }) => {
    await using t = await projects(`
      view imported_root_scope of entreprise {
        include *
      }
    `)

    await t.validateAll()
    const parsed = await t.services.likec4.ModelBuilder.parseModel(ProjectId('hermes'))
    invariant(parsed)

    const parsedView = parsed.$data.views[ViewId('imported_root_scope')]
    invariant(parsedView)
    invariant(isElementView(parsedView))
    expect(parsedView.title).toBe('Entreprise')
    expect(parsed.$data.imports['contrat']?.map(e => e.id)).toEqual([
      'entreprise',
      'entreprise.refonteExtranetEntrepriseBack',
    ])

    const model = await t.buildModel('hermes')
    const view = model.views[ViewId('imported_root_scope')]
    invariant(view)
    invariant(isElementView(view))
    expect(view.title).toBe('Entreprise')
    expect(view.viewOf).toBe(importedRoot)
    expect(view.nodes.map(n => n.id)).toEqual(expect.arrayContaining([
      importedRoot,
      importedBackend,
    ]))
  })

  it('computes dynamic-only steps that reference imported nested elements', async ({ expect }) => {
    await using t = await projects(`
      dynamic view process_reception_dat_entreprise {
        entreprise.refonteExtranetEntrepriseBack -> hermesPrevoyance.noyau_wsedimachine 'Transmission'
      }
    `)

    const model = await t.buildLikeC4Model('hermes')
    const view = model.$data.views[ViewId('process_reception_dat_entreprise')]
    invariant(view)
    invariant(isDynamicView(view))

    expect(model.findElement(importedBackend)).not.toBeNull()
    expect(model.findElement('entreprise.refonteExtranetEntrepriseBack')).toBeNull()
    expect(view.nodes.map(n => n.id)).toEqual(expect.arrayContaining([
      importedBackend,
      localService,
    ]))
    expect(view.edges).toMatchObject([
      {
        source: importedBackend,
        target: localService,
        label: 'Transmission',
      },
    ])
  })

  it('preserves imported endpoints in parsed direct, backward, and chained steps', async ({ expect }) => {
    await using t = await projects(`
      dynamic view imported_as_source {
        entreprise.refonteExtranetEntrepriseBack -> hermesPrevoyance.noyau_wsedimachine
      }

      dynamic view imported_as_target {
        hermesPrevoyance.noyau_wsedimachine -> entreprise.refonteExtranetEntrepriseBack
      }

      dynamic view imported_backward {
        hermesPrevoyance.noyau_wsedimachine <- entreprise.refonteExtranetEntrepriseBack
      }

      dynamic view imported_chain {
        entreprise.refonteExtranetEntrepriseBack
          -> hermesPrevoyance.noyau_wsedimachine
          -> entreprise.refonteExtranetEntrepriseBack
      }
    `)

    await t.validateAll()
    const parsed = await t.services.likec4.ModelBuilder.parseModel(ProjectId('hermes'))
    invariant(parsed)

    const importedAsSource = parsed.$data.views[ViewId('imported_as_source')]
    invariant(importedAsSource)
    invariant(isDynamicView(importedAsSource))
    expect(importedAsSource.steps[0]).toMatchObject({
      source: importedBackend,
      target: localService,
    })

    const importedAsTarget = parsed.$data.views[ViewId('imported_as_target')]
    invariant(importedAsTarget)
    invariant(isDynamicView(importedAsTarget))
    expect(importedAsTarget.steps[0]).toMatchObject({
      source: localService,
      target: importedBackend,
    })

    const importedBackward = parsed.$data.views[ViewId('imported_backward')]
    invariant(importedBackward)
    invariant(isDynamicView(importedBackward))
    expect(importedBackward.steps[0]).toMatchObject({
      source: importedBackend,
      target: localService,
      isBackward: true,
    })

    const importedChain = parsed.$data.views[ViewId('imported_chain')]
    invariant(importedChain)
    invariant(isDynamicView(importedChain))
    const [series] = importedChain.steps
    invariant(stepGuards.isSeries(series))
    expect(series.steps).toMatchObject([
      {
        source: importedBackend,
        target: localService,
      },
      {
        source: localService,
        target: importedBackend,
        isBackward: true,
      },
    ])
  })

  it('computes imported endpoints inside nested dynamic flows', async ({ expect }) => {
    await using t = await projects(`
      dynamic view nested_flows {
        parallel {
          entreprise.refonteExtranetEntrepriseBack -> hermesPrevoyance.noyau_wsedimachine
          try {
            hermesPrevoyance.noyau_wsedimachine <- entreprise.refonteExtranetEntrepriseBack
          } finally {
            hermesPrevoyance.noyau_wsedimachine -> entreprise.refonteExtranetEntrepriseBack
          }
        }
      }
    `)

    const model = await t.buildModel('hermes')
    const view = model.views[ViewId('nested_flows')]
    invariant(view)
    invariant(isDynamicView(view))

    expect(view.edges.map(e => [e.source, e.target])).toEqual([
      [importedBackend, localService],
      [importedBackend, localService],
      [localService, importedBackend],
    ])
  })

  it('derives relation metadata for imported dynamic endpoints', async ({ expect }) => {
    await using t = await projects(`
      dynamic view relation_metadata {
        entreprise.refonteExtranetEntrepriseBack -> hermesPrevoyance.noyau_wsedimachine
      }
    `)

    await t.addDocument(
      'hermes/relations.c4',
      `
        import { entreprise } from 'contrat'
        model {
          entreprise.refonteExtranetEntrepriseBack
            .async hermesPrevoyance.noyau_wsedimachine
            'Sends DAT archive'
            'Compressed DAT payload'
        }
      `,
    )

    const model = await t.buildModel('hermes')
    const view = model.views[ViewId('relation_metadata')]
    invariant(view)
    invariant(isDynamicView(view))

    expect(view.edges).toMatchObject([
      {
        source: importedBackend,
        target: localService,
        label: 'Sends DAT archive',
        technology: 'Async channel',
        relations: [expect.any(String)],
      },
    ])
  })
})
