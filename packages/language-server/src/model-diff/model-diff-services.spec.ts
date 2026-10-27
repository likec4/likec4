import type { DiffId, ParsedLikeC4ModelData, ProjectId } from '@likec4/core'
import { applyModelDiff } from '@likec4/core/compute-view'
import type { LangiumDocument } from 'langium'
import { mapValues, values } from 'remeda'
import { describe, it, vi } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type { WorkspaceEdit } from 'vscode-languageserver-types'
import { isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { createTestServices } from '../test'
import type { SafeDeleteOptions } from './RemovalImpact'
import { DocumentEdits } from './text-edits'

const model = `
  specification {
    element actor
    element system
    element component
    deploymentNode node
  }
  model {
    customer = actor 'Customer'
    cloud = system 'Cloud' {
      api = component 'API'
      legacy = component 'Legacy' {
        db = component 'DB'
      }
      audit = component 'Audit'
    }
    customer -> cloud.api 'uses'
    customer -> cloud.legacy 'uses legacy'
    cloud.api -> cloud.legacy.db 'reads'
    cloud.legacy -> cloud.audit 'logs'
  }
  deployment {
    node prod {
      instanceOf cloud.api
      legacyInstance = instanceOf cloud.legacy
    }
  }
  views {
    view index {
      include *
    }
    view cloud of cloud {
      include *, cloud.legacy.db
      style cloud.legacy {
        color red
      }
    }
    view legacy of cloud.legacy {
      include *
    }
    dynamic view flow {
      customer -> cloud.api
      customer -> cloud.legacy
    }
  }
`

const extension = `
  model {
    extend cloud.legacy {
      cache = component 'Cache'
    }
  }
`

function applyEdit(document: LangiumDocument, edit: WorkspaceEdit): string {
  return TextDocument.applyEdits(document.textDocument, edit.changes?.[document.uri.toString()] ?? [])
}

async function setup(...sources: string[]) {
  const test = createTestServices()
  const documents = [] as LangiumDocument[]
  for (const source of sources) {
    documents.push(await test.addDocument(source))
  }
  const { errors, warnings } = await test.validateAll()
  return { ...test, documents, errors, warnings }
}

async function errorsOf(...sources: string[]) {
  const { errors } = await setup(...sources)
  return errors
}

async function removalEdits(services: LikeC4Services, targets: string[], options: SafeDeleteOptions = {}) {
  const edits = new DocumentEdits()
  await services.likec4.RemovalImpact.addEdits(edits, targets, undefined, options)
  return edits.toWorkspaceEdit()
}

/**
 * Elements and relations of the model, without ids and source locations
 */
function modelShape(data: ParsedLikeC4ModelData) {
  return {
    elements: mapValues(data.elements, e => ({
      kind: e.kind,
      title: e.title,
      technology: e.technology ?? null,
      description: e.description ?? null,
      tags: [...(e.tags ?? [])].sort(),
      links: (e.links ?? []).map(l => l.url).sort(),
      metadata: e.metadata ?? {},
    })),
    relations: values(data.relations)
      .map(r => `${r.source.model} -> ${r.target.model} '${r.title ?? ''}' [${[...(r.tags ?? [])].sort().join(',')}]`)
      .sort(),
  }
}

describe('RemovalImpact', () => {
  it('reports what the removal takes with it', async ({ expect }) => {
    const { services, errors } = await setup(model, extension)
    expect(errors).toEqual([])
    const report = await services.likec4.RemovalImpact.analyze(['cloud.legacy'])
    expect(report).not.toBeNull()
    expect([...report!.impact.elements].sort()).toEqual(['cloud.legacy', 'cloud.legacy.cache', 'cloud.legacy.db'])
    expect(report!.impact.orphans).toEqual(['cloud.audit'])
    const kinds = report!.references.map(r => `${r.kind}:${r.resolution}`)
    expect(kinds).toEqual(expect.arrayContaining([
      'relation:removed',
      'extend-element:removed',
      'deployed-instance:removed',
      'view-predicate:removed',
      'view-scope:optional',
      'dynamic-step:optional',
    ]))
    expect(report!.references.filter(r => r.kind === 'relation')).toHaveLength(3)
  })

  it('lays out the impact view', async ({ expect }) => {
    const { services } = await setup(model, extension)
    const diagram = await services.likec4.RemovalImpact.impactView(['cloud.legacy'])
    const status = Object.fromEntries(diagram!.nodes.map(n => [n.id, n.diffStatus ?? null]))
    expect(status).toMatchObject({
      'cloud.legacy': 'removed',
      'cloud.audit': 'orphan',
      'customer': null,
    })
  })

  it('removes the element and its references, keeps optional ones', async ({ expect }) => {
    const { services, documents } = await setup(model, extension)
    const edit = await removalEdits(services, ['cloud.legacy'])
    const [modelText, extensionText] = documents.map(d => applyEdit(d, edit))

    expect(modelText).not.toContain(`legacy = component`)
    expect(modelText).not.toContain(`'uses legacy'`)
    expect(modelText).not.toContain(`'reads'`)
    expect(modelText).not.toContain(`'logs'`)
    expect(modelText).not.toContain('legacyInstance')
    expect(modelText).not.toContain('style cloud.legacy')
    expect(modelText).toContain(`include *\n`)
    expect(modelText).toContain('instanceOf cloud.api')
    // Optional references stay by default
    expect(modelText).toContain('view legacy of cloud.legacy')
    expect(modelText).toContain('customer -> cloud.legacy\n')
    expect(extensionText).not.toContain('extend cloud.legacy')
  })

  it('leaves no dangling references when optional references are removed too', async ({ expect }) => {
    const { services, documents } = await setup(model, extension)
    const edit = await removalEdits(services, ['cloud.legacy'], {
      includeScopedViews: true,
      includeDynamicSteps: true,
      includeOrphans: true,
    })
    const texts = documents.map(d => applyEdit(d, edit))
    expect(texts.join('\n')).not.toContain('legacy')
    expect(texts.join('\n')).not.toContain('audit')
    expect(await errorsOf(...texts)).toEqual([])
  })
})

describe('RemovalImpact with diffs', () => {
  it('leaves references in diffs to the owner of the diff', async ({ expect }) => {
    const cleanup = `
      diff cleanup {
        remove {
          cloud.legacy
          cloud.audit
        }
      }
    `
    const { services, documents } = await setup(model, cleanup)
    const report = await services.likec4.RemovalImpact.analyze(['cloud.legacy'])
    expect(report!.references.filter(r => r.kind === 'diff').map(r => r.resolution)).toEqual(['manual'])

    const edit = await removalEdits(services, ['cloud.legacy'], {
      includeScopedViews: true,
      includeDynamicSteps: true,
    })
    const [, diffText] = documents.map(d => applyEdit(d, edit))
    expect(diffText).toBe(documents[1]!.textDocument.getText())
  })
})

describe('Diff overlaps', () => {
  const overlapWarnings = async (...sources: string[]) => {
    const { warnings, errors } = await setup(model, ...sources)
    return { errors, overlaps: warnings.filter(w => w.startsWith('Overlaps with diff')) }
  }

  it('warns when diffs remove the same element, or one uses what the other removes', async ({ expect }) => {
    const { overlaps } = await overlapWarnings(
      `diff rfcA { remove { cloud.legacy } }`,
      `diff rfcB { remove { cloud.legacy.db } add { customer -> cloud.legacy 'pays' } }`,
    )
    expect(overlaps).toEqual(expect.arrayContaining([
      expect.stringContaining('Overlaps with diff rfcB: both remove cloud.legacy.db'),
      expect.stringContaining('Overlaps with diff rfcA: rfcA removes cloud.legacy, rfcB uses it'),
    ]))
  })

  it('warns when diffs add the same element or relationship, or set the same metadata', async ({ expect }) => {
    const { overlaps, errors } = await overlapWarnings(
      `diff rfcA {
        add {
          extend cloud { cache = component 'Redis' }
          customer -> cloud.api 'pays'
          extend cloud.api { metadata { owner 'team-a' } }
        }
      }`,
      `diff rfcB {
        add {
          extend cloud { cache = component 'Memcached' }
          customer -> cloud.api 'pays'
          extend cloud.api { metadata { owner 'team-b' } }
        }
      }`,
    )
    expect(errors).toEqual([])
    expect(overlaps).toEqual(expect.arrayContaining([
      expect.stringContaining('both add cloud.cache'),
      expect.stringContaining(`both add customer -> cloud.api 'pays'`),
      expect.stringContaining(`both set metadata 'owner' of cloud.api`),
    ]))
  })

  it('warns when a diff uses an element that only another diff adds', async ({ expect }) => {
    const { overlaps } = await overlapWarnings(
      `diff rfcA { add { extend cloud { cache = component 'Cache' } } }`,
      `diff rfcB { add { cloud.api -> cloud.cache 'caches' } }`,
    )
    expect(overlaps).toEqual(expect.arrayContaining([
      expect.stringContaining('rfcB uses cloud.cache, which only rfcA adds'),
    ]))
  })

  it('needs accepted overlaps to apply, and reports the diffs the apply broke', async ({ expect }) => {
    const { services, documents } = await setup(
      model,
      `diff rfcA { remove { cloud.audit } }`,
      `diff rfcB { add { extend cloud.audit { metadata { owner 'team-b' } } } }`,
    )
    memoryFiles(services, documents)
    const request = { type: 'apply-diff', diffId: 'rfcA' as DiffId, action: 'apply' } as const

    const preview = await services.likec4.ModelEdits.preview(request)
    expect(preview).toMatchObject({ overlaps: ['rfcB: rfcA removes cloud.audit, rfcB uses it'] })

    const refused = await services.likec4.ModelEdits.apply(request)
    expect(refused.applied).toBe(false)
    expect(refused.error).toContain('overlaps with other diffs')

    const result = await services.likec4.ModelEdits.apply({ ...request, acceptOverlaps: true })
    expect(result.applied).toBe(true)
    expect(result.remaining.map(r => r.diffId)).toContain('rfcB')
  })

  it('refuses to apply a diff with errors', async ({ expect }) => {
    const { services } = await setup(model, `diff rfcA { remove { customer -> cloud.api 'unknown' } }`)
    const result = await services.likec4.ModelEdits.apply({
      type: 'apply-diff',
      diffId: 'rfcA' as DiffId,
      action: 'apply',
    })
    expect(result.applied).toBe(false)
    expect(result.error).toContain('Diff rfcA has errors')
  })
})

const diffs = `
  diff rfc1 'Payments' {
    remove {
      cloud.legacy
      customer -> cloud.api 'uses'
    }
    add {
      extend cloud {
        payments = component 'Payments'
      }
      customer -> cloud.payments 'pays'
    }
  }
`

describe('ModelDiffs', () => {
  it('lists diffs with the views they change', async ({ expect }) => {
    const { services, errors } = await setup(model, diffs)
    expect(errors).toEqual([])
    const [summary] = await services.likec4.ModelDiffs.list()
    expect(summary).toMatchObject({
      id: 'rfc1',
      title: 'Payments',
      added: { elements: 1, relations: 1 },
      removed: { elements: 1, relations: 1 },
    })
    expect(summary!.views.map(v => v.id)).toEqual(expect.arrayContaining(['index', 'cloud', 'legacy', 'flow']))
  })

  it('lays out compare views', async ({ expect }) => {
    const { services } = await setup(model, diffs)
    const diagram = await services.likec4.ModelDiffs.layoutCompareView({
      viewId: 'cloud' as never,
      diffId: 'rfc1' as DiffId,
    })
    const status = Object.fromEntries(diagram!.nodes.map(n => [n.id, n.diffStatus ?? null]))
    expect(status).toMatchObject({
      'cloud.legacy': 'removed',
      'cloud.payments': 'added',
      'cloud.api': null,
    })
  })

  it('moves a dynamic view from the diff into views', async ({ expect }) => {
    const source = `
specification {
  element system
}
model {
  shop = system 'Shop'
  bank = system 'Bank'
}
views {
  view index {
    include *
  }
}
diff rfc1 {
  add {
    payments = system 'Payments'
  }
  views {
    dynamic view checkout {
      variant sequence
      title 'Checkout'
      shop -> payments 'requests payment'
      payments -> bank 'charges'
    }
  }
}
`
    const { services, documents, errors } = await setup(source)
    expect(errors).toEqual([])
    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc1' as DiffId, 'apply')
    const text = applyEdit(documents[0]!, edits.toWorkspaceEdit())
    expect(text).toContain(`dynamic view checkout`)
    expect(text).toContain(`variant sequence`)
    expect(text).not.toContain('diff rfc1')
    expect(text.indexOf('dynamic view checkout')).toBeGreaterThan(text.indexOf('view index'))
    const parsed = await setup(text)
    expect(parsed.errors).toEqual([])
    expect(parsed.documents[0]).toBeDefined()
  })

  it('keeps an applied dynamic view out of a foldered views block', async ({ expect }) => {
    const source = `
specification {
  element system
}
model {
  shop = system 'Shop'
  bank = system 'Bank'
}
views 'Team' {
  view one { include * }
  view two { include * }
  view three { include * }
}
views {
  view index { include * }
}
diff rfc1 {
  add {
    payments = system 'Payments'
  }
  views {
    dynamic view checkout {
      variant sequence
      title 'Checkout'
      shop -> payments 'requests payment'
    }
  }
}
`
    const { services, documents, errors } = await setup(source)
    expect(errors).toEqual([])
    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc1' as DiffId, 'apply')
    const text = applyEdit(documents[0]!, edits.toWorkspaceEdit())
    const plain = text.indexOf('views {')
    const checkout = text.indexOf('dynamic view checkout')
    expect(checkout).toBeGreaterThan(plain)
    expect(text.slice(0, plain)).not.toContain('dynamic view checkout')
    const parsed = await setup(text)
    expect(parsed.errors).toEqual([])
    const document = parsed.documents[0]
    expect(isParsedLikeC4LangiumDocument(document)).toBe(true)
    if (!isParsedLikeC4LangiumDocument(document)) {
      return
    }
    expect(document.c4Views.find(view => view.id === 'checkout')?.title).toBe('Checkout')
  })

  it('applies the diff to the model', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc1' as DiffId, 'apply', 'default' as ProjectId)
    const edit = edits.toWorkspaceEdit()
    const [modelText, diffText] = documents.map(d => applyEdit(d, edit))

    expect(modelText).not.toContain('legacy')
    expect(modelText).not.toContain(`'uses'`)
    expect(modelText).toContain([
      `    audit = component 'Audit'`,
      `    payments = component 'Payments'`,
      '  }',
    ].join('\n'))
    expect(modelText).toContain([
      `  customer -> cloud.payments 'pays'`,
      '}',
    ].join('\n'))
    expect(diffText!.trim()).toBe('')
    expect(await errorsOf(modelText!, diffText!)).toEqual([])
  })

  it('merges the diff into the definitions', async ({ expect }) => {
    const base = `
specification {
  element system
  element component
  tag old
  tag next
}
model {
  cloud = system 'Cloud' {
    #old
    link https://a.example 'A'
    metadata {
      owner 'team-a'
    }
    api = component 'API' {
      technology 'Go'
    }
    worker = component 'Worker'
  }
  other = system 'Other'
}
`
    const diff = `
// Proposal for the queue
// (second line)
diff rfc2 {
  add {
    extend cloud {
      #next
      link https://a.example 'A'
      link https://b.example 'B'
      metadata {
        owner 'team-b'
        tier 'gold'
      }
      queue = component 'Queue'
    }
    extend cloud.api {
      #next
    }
    extend cloud.worker {
      #next
    }
    extend other {
      metadata {
        owner 'x'
      }
    }
    newSystem = system 'New System'
    cloud.queue -> other 'sends'
  }
}
`
    const { services, documents } = await setup(base, diff)
    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc2' as DiffId, 'apply')
    const [modelText, diffText] = documents.map(d => applyEdit(d, edits.toWorkspaceEdit()))

    expect(modelText).toBe(`
specification {
  element system
  element component
  tag old
  tag next
}
model {
  cloud = system 'Cloud' {
    #old #next
    link https://a.example 'A'
    metadata {
      owner 'team-b'
      tier 'gold'
    }
    link https://b.example 'B'
    api = component 'API' {
      #next
      technology 'Go'
    }
    worker = component 'Worker' {
      #next
    }
    queue = component 'Queue'
  }
  other = system 'Other' {
    metadata {
      owner 'x'
    }
  }

  newSystem = system 'New System'
  cloud.queue -> other 'sends'
}
`)
    expect(diffText!.trim()).toBe('')
    expect(await errorsOf(modelText!, diffText!)).toEqual([])
  })

  it('applies the diff with the same result as the to-be state', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    const before = await services.likec4.ModelBuilder.parseModel()
    const expected = applyModelDiff(before!.$data, before!.$data.diffs!['rfc1' as DiffId]!)

    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc1' as DiffId, 'apply')
    const texts = documents.map(d => applyEdit(d, edits.toWorkspaceEdit()))

    const applied = await setup(...texts)
    const actual = await applied.services.likec4.ModelBuilder.parseModel()
    expect(modelShape(actual!.$data)).toEqual(modelShape(expected))
  })

  it('deletes the comment lines above the diff', async ({ expect }) => {
    const { services, documents } = await setup(
      model,
      `
      // Comment of the diff
      diff rfc1 {
        remove {
          cloud.audit
        }
      }

      // Comment of the model block
      model {
      }
    `,
    )
    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc1' as DiffId, 'discard')
    const [, diffText] = documents.map(d => applyEdit(d, edits.toWorkspaceEdit()))
    expect(diffText!.trim()).toBe('// Comment of the model block\nmodel {\n}')
  })

  it('discards the diff', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    const edits = new DocumentEdits()
    await services.likec4.ModelDiffs.addEdits(edits, 'rfc1' as DiffId, 'discard')
    const edit = edits.toWorkspaceEdit()
    const [modelText, diffText] = documents.map(d => applyEdit(d, edit))
    expect(diffText!.trim()).toBe('')
    expect(modelText).toContain('legacy = component')
  })
})

/**
 * Files are kept in memory: edits are written to the map, documents are reloaded from it.
 */
function memoryFiles(services: LikeC4Services, documents: ReadonlyArray<LangiumDocument>) {
  const files = new Map(documents.map(d => [d.uri.toString(), d.textDocument.getText()]))
  const fileSystem = services.shared.workspace.FileSystemProvider
  vi.spyOn(fileSystem, 'writeFile').mockImplementation(async (uri, content) => {
    files.set(uri.toString(), content)
  })
  vi.spyOn(fileSystem, 'readFile').mockImplementation(async uri => files.get(uri.toString()) ?? '')
  return files
}

describe('ModelEdits', () => {
  const applyDiff = { type: 'apply-diff', diffId: 'rfc1' as DiffId, action: 'apply' } as const
  const deleteAudit = { type: 'safe-delete', targets: ['cloud.audit'] } as const

  it('previews, applies and rolls back the edit', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    const files = memoryFiles(services, documents)
    const original = [...files.values()]
    const edits = services.likec4.ModelEdits

    const preview = await edits.preview(applyDiff)
    if ('error' in preview) {
      throw new Error(preview.error)
    }
    expect(preview.label).toBe('Apply diff rfc1')
    expect(preview.documents.map(d => d.uri)).toEqual(documents.map(d => d.uri.toString()))
    expect(preview.documents.map(d => d.before)).toEqual(original)

    const result = await edits.apply(applyDiff, { token: preview.token })
    expect(result).toMatchObject({ applied: true, remaining: [], edit: { label: 'Apply diff rfc1' } })
    expect([...files.values()]).toEqual(preview.documents.map(d => d.after))

    const rollback = await edits.rollback(result.edit!.id)
    expect(rollback).toMatchObject({ applied: true, remaining: [] })
    expect([...files.values()]).toEqual(original)
    expect((await edits.rollback()).error).toBe('There is no edit to roll back')
  })

  it('does not apply the edit if the model changed after the preview', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    memoryFiles(services, documents)
    const edits = services.likec4.ModelEdits
    const preview = await edits.preview(applyDiff)
    if ('error' in preview) {
      throw new Error(preview.error)
    }
    await edits.apply(deleteAudit)
    const result = await edits.apply(applyDiff, { token: preview.token })
    expect(result.applied).toBe(false)
    expect(result.error).toContain('changed after the preview')
  })

  it('does not roll back the edit if the document changed after it', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    memoryFiles(services, documents)
    const edits = services.likec4.ModelEdits
    const first = await edits.apply(deleteAudit)
    await edits.apply({ type: 'safe-delete', targets: ['customer'] })

    const result = await edits.rollback(first.edit!.id)
    expect(result.applied).toBe(false)
    expect(result.error).toContain('changed after "Safe delete cloud.audit"')

    // The latest edit first, then the previous one
    expect((await edits.rollback()).applied).toBe(true)
    expect((await edits.rollback()).applied).toBe(true)
    expect(await errorsOf(...documents.map(d => d.textDocument.getText()))).toEqual([])
  })

  it('apply — when the files cannot be written then returns a failed result and records no edit', async ({ expect }) => {
    const { services } = await setup(model, diffs)
    vi.spyOn(services.shared.workspace.FileSystemProvider, 'writeFile').mockRejectedValue(
      new Error('No file system is available.'),
    )
    const edits = services.likec4.ModelEdits

    expect(await edits.apply(applyDiff)).toEqual({
      applied: false,
      remaining: [],
      error: 'The edit was not applied: No file system is available.',
    })
    expect((await edits.rollback()).error).toBe('There is no edit to roll back')
  })

  it('apply — when a write fails then restores the files written before', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    const files = memoryFiles(services, documents)
    const original = [...files.values()]
    const writeFile = vi.mocked(services.shared.workspace.FileSystemProvider.writeFile)
    writeFile
      .mockImplementationOnce(writeFile.getMockImplementation()!)
      .mockRejectedValueOnce(new Error('Permission denied'))

    const result = await services.likec4.ModelEdits.apply(applyDiff)
    expect(result.error).toBe('The edit was not applied: Permission denied')
    expect([...files.values()]).toEqual(original)
  })

  it('apply — when a written file cannot be restored then names it', async ({ expect }) => {
    const { services, documents } = await setup(model, diffs)
    memoryFiles(services, documents)
    const writeFile = vi.mocked(services.shared.workspace.FileSystemProvider.writeFile)
    writeFile
      .mockImplementationOnce(writeFile.getMockImplementation()!)
      .mockRejectedValue(new Error('Disk full'))

    const result = await services.likec4.ModelEdits.apply(applyDiff)
    expect(result.error).toMatch(/^The edit was not applied: Disk full\. Restore failed, check \S+$/)
  })
})
