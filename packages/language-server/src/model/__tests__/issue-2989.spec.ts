// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ViewId } from '@likec4/core'
import { invariant, isDynamicView, ProjectId, stepGuards } from '@likec4/core'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../../test'

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
  it('computes dynamic-only steps that reference imported nested elements', async ({ expect }) => {
    await using t = await projects(`
      dynamic view process_reception_dat_entreprise {
        entreprise.refonteExtranetEntrepriseBack -> hermesPrevoyance.noyau_wsedimachine 'Transmission'
      }
    `)

    const model = await t.buildLikeC4Model('hermes')
    const view = model.$data.views['process_reception_dat_entreprise' as ViewId]
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

    const importedAsSource = parsed.$data.views['imported_as_source' as ViewId]
    invariant(importedAsSource)
    invariant(isDynamicView(importedAsSource))
    expect(importedAsSource.steps[0]).toMatchObject({
      source: importedBackend,
      target: localService,
    })

    const importedAsTarget = parsed.$data.views['imported_as_target' as ViewId]
    invariant(importedAsTarget)
    invariant(isDynamicView(importedAsTarget))
    expect(importedAsTarget.steps[0]).toMatchObject({
      source: localService,
      target: importedBackend,
    })

    const importedBackward = parsed.$data.views['imported_backward' as ViewId]
    invariant(importedBackward)
    invariant(isDynamicView(importedBackward))
    expect(importedBackward.steps[0]).toMatchObject({
      source: importedBackend,
      target: localService,
      isBackward: true,
    })

    const importedChain = parsed.$data.views['imported_chain' as ViewId]
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
    const view = model.views['nested_flows' as ViewId]
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
    const view = model.views['relation_metadata' as ViewId]
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
