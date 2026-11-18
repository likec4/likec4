import type { LayoutedLikeC4ModelData, ProjectId } from '@likec4/core/types'
import MarkdownIt from 'markdown-it'
import { describe, expect, it, vi } from 'vitest'
import { jsonForScript } from './html.ts'
import { likec4MarkdownIt, modelElementId } from './markdownItPlugin.ts'
import type { ResolvedProject } from './resolveProject.ts'
import type { ProjectSnapshot, RenderDeps } from './types.ts'

function makeProject(id: string, folderUri: string, name = id): ResolvedProject {
  const parsed = new URL(folderUri)
  return {
    id: id as ProjectId,
    name,
    folderUri,
    scheme: parsed.protocol.slice(0, -1),
    authority: parsed.host,
    folderPath: parsed.pathname,
    docs: [`${folderUri}/model.c4`],
  }
}

function makeSnapshot(projectId: string, viewIds: string[], hash = 'h1', extraSize = 0): ProjectSnapshot {
  const views: Record<string, unknown> = {}
  for (const id of viewIds) {
    views[id] = { id, title: `${id} </script>`, padding: 'a'.repeat(extraSize) }
  }
  const data = {
    $data: '1',
    projectId,
    views,
    elements: {},
    relations: {},
  } as unknown as LayoutedLikeC4ModelData
  const modelJson = jsonForScript(data)
  return {
    hash,
    state: 'ok',
    viewIds: new Set(viewIds),
    data,
    modelJson,
    modelBytes: Buffer.byteLength(modelJson),
  }
}

function createDeps(overrides: Partial<RenderDeps> = {}): {
  deps: RenderDeps
  project: ResolvedProject
  snap: ProjectSnapshot
  recordReferences: ReturnType<typeof vi.fn>
} {
  const project = makeProject('shop', 'file:///ws/shop')
  const snap = makeSnapshot('shop', ['index', 'checkout'])
  const recordReferences = vi.fn<(docKey: string, projects: ReadonlyArray<ResolvedProject>) => void>()
  const deps: RenderDeps = {
    enabled: () => true,
    maxModelBytes: () => 5 * 1024 * 1024,
    maxHeight: () => 500,
    colorScheme: () => 'auto',
    panZoom: () => false,
    resolve: () => ({ ok: true, project }),
    snapshot: () => snap,
    recordReferences,
    ...overrides,
  }
  return { deps, project, snap, recordReferences }
}

describe('likec4MarkdownIt', () => {
  it('renders shared model once and unique view hosts for valid blocks', () => {
    const { deps, project, recordReferences } = createDeps()
    const md = likec4MarkdownIt(new MarkdownIt(), deps)
    const env = { currentDocument: { scheme: 'file', authority: '', path: '/ws/shop/README.md' } }

    const html = md.render(
      [
        '```likec4-view',
        'index',
        '```',
        '',
        '```likec4-view dynamic-variant=sequence browser=false',
        'index',
        '```',
      ].join('\n'),
      env,
    )

    const modelId = modelElementId(project)
    expect(html.match(/class="likec4-model"/g)).toHaveLength(1)
    expect(html).toContain(`id="${modelId}"`)
    expect(html).toContain(`-index-1"`)
    expect(html).toContain(`-index-2"`)
    expect(html).not.toContain('</script><script>')
    expect(html).toContain('\\u003c/script\\u003e')
    expect(recordReferences).toHaveBeenCalledWith('file:///ws/shop/README.md', [project])
  })

  it('delegates to prior fence rules and preserves non-likec4 blocks and tilde fences', () => {
    const { deps } = createDeps()
    const md = new MarkdownIt()
    const mermaidSpy = vi.fn<() => string>(() => '<div class="mermaid">ok</div>\n')
    const prev = md.renderer.rules.fence
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      if (tokens[idx]!.info === 'mermaid') {
        return mermaidSpy()
      }
      return prev ? prev(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
    }

    likec4MarkdownIt(md, deps)

    const html = md.render(['```mermaid', 'graph TD; A-->B', '```', '', '~~~likec4-view', 'index', '~~~'].join('\n'))
    expect(mermaidSpy).toHaveBeenCalledTimes(1)
    expect(html).toContain('<div class="mermaid">ok</div>')
    expect(html).toContain('<pre><code class="language-likec4-view">')
  })

  it('falls back to original fence rule when disabled', () => {
    const { deps } = createDeps({ enabled: () => false })
    const md = likec4MarkdownIt(new MarkdownIt(), deps)
    const html = md.render('```likec4-view\nindex\n```\n')
    expect(html).not.toContain('class="likec4-view"')
    expect(html).toContain('<pre><code class="language-likec4-view">index\n</code></pre>')
  })

  it('emits structured error hosts for invalid block syntax, invalid id, missing view, and loading states', () => {
    const { deps } = createDeps()
    const md = likec4MarkdownIt(new MarkdownIt(), deps)

    const errHtml = md.render(
      ['```likec4-view', 'one', 'two', '```', '', '```likec4-view', '1bad', '```', '', '```likec4-view', 'nope', '```']
        .join('\n'),
    )
    expect(errHtml).toContain('likec4-error-1')
    expect(errHtml).toContain('likec4-error-2')
    expect(errHtml).toContain('Invalid view id')
    expect(errHtml).toContain('View \\"nope\\" not found')

    const pendingMark = vi.fn<(docKey: string) => void>()
    const { deps: pendingDeps } = createDeps({
      resolve: () => 'pending',
      markPendingDiscovery: pendingMark,
    })
    const pendingMd = likec4MarkdownIt(new MarkdownIt(), pendingDeps)
    const pendingHtml = pendingMd.render('```likec4-view\nindex\n```\n', {
      currentDocument: { scheme: 'file', authority: '', path: '/ws/README.md' },
    })
    expect(pendingHtml).toContain('"state":"loading"')
    expect(pendingMark).toHaveBeenCalledWith('file:///ws/README.md')
  })

  it('trims unreferenced views when payload exceeds maxModelBytes and avoids state leak across shared env', () => {
    const project = makeProject('shop', 'file:///ws/shop')
    const bigSnap = makeSnapshot('shop', ['index', 'unused'], 'big', 2000)
    const deps: RenderDeps = {
      enabled: () => true,
      maxModelBytes: () => 500,
      maxHeight: () => 500,
      colorScheme: () => 'auto',
      panZoom: () => false,
      resolve: () => ({ ok: true, project }),
      snapshot: () => bigSnap,
      recordReferences: vi.fn<(docKey: string, projects: ReadonlyArray<ResolvedProject>) => void>(),
    }
    const md = likec4MarkdownIt(new MarkdownIt(), deps)
    const sharedEnv = { currentDocument: { scheme: 'file', authority: '', path: '/ws/shop/README.md' } }

    const first = md.render('```likec4-view\nindex\n```\n', sharedEnv)
    expect(first).toContain('"trimmed":true')
    expect(first).not.toContain('"unused"')

    const second = md.render('```likec4-view\nindex\n```\n', sharedEnv)
    expect(second).toContain('class="likec4-model"')
    expect(second).toContain('-index-1"')
  })

  it('passes stale and trimmed data cleanly to renderHostBody', () => {
    const { deps, snap } = createDeps({
      snapshot: () => ({
        ...snap,
        state: 'stale',
        message: 'model.c4:3: syntax error',
      }),
      renderHostBody: (_s, viewId, opts, hostId, data) =>
        `<div class="notice">${data.state}:${data.message}</div><svg data-host="${hostId}" data-view="${viewId}" data-scheme="${opts.scheme}"/>`,
    })
    const md = likec4MarkdownIt(new MarkdownIt(), deps)
    const html = md.render('```likec4-view color-scheme=light\nindex\n```\n')
    expect(html).toContain('"state":"stale"')
    expect(html).toContain('stale:model.c4:3: syntax error')
    expect(html).toContain('data-scheme="light"')
  })

  it('includes a view-set digest in modelHash for :v and :t payloads', () => {
    const { deps } = createDeps()
    const md = likec4MarkdownIt(new MarkdownIt(), deps)

    const single = md.render('```likec4-view browser=false\nindex\n```\n')
    const both = md.render(
      ['```likec4-view browser=false', 'index', '```', '', '```likec4-view browser=false', 'checkout', '```'].join(
        '\n',
      ),
    )

    const singleMatch = single.match(/"hash":"(h1:v:[^"]+)"/)
    const bothMatch = both.match(/"hash":"(h1:v:[^"]+)"/)
    expect(singleMatch?.[1]).toBeDefined()
    expect(bothMatch?.[1]).toBeDefined()
    expect(singleMatch![1]).not.toBe(bothMatch![1])
    expect(both.match(/class="likec4-model"/g)).toHaveLength(1)

    const project = makeProject('shop', 'file:///ws/shop')
    const bigSnap = makeSnapshot('shop', ['index', 'checkout', 'unused'], 'big', 2000)
    const trimmedDeps: RenderDeps = {
      enabled: () => true,
      maxModelBytes: () => 500,
      maxHeight: () => 500,
      colorScheme: () => 'auto',
      panZoom: () => false,
      resolve: () => ({ ok: true, project }),
      snapshot: () => bigSnap,
      recordReferences: vi.fn<(docKey: string, projects: ReadonlyArray<ResolvedProject>) => void>(),
    }
    const trimmedMd = likec4MarkdownIt(new MarkdownIt(), trimmedDeps)
    const trimmedOne = trimmedMd.render('```likec4-view\nindex\n```\n')
    const trimmedTwo = trimmedMd.render('```likec4-view\nindex\n```\n\n```likec4-view\ncheckout\n```\n')
    const trimmedOneHash = trimmedOne.match(/"hash":"(big:t:[^"]+)"/)?.[1]
    const trimmedTwoHash = trimmedTwo.match(/"hash":"(big:t:[^"]+)"/)?.[1]
    expect(trimmedOneHash).toBeDefined()
    expect(trimmedTwoHash).toBeDefined()
    expect(trimmedOneHash).not.toBe(trimmedTwoHash)
  })
})
