import type { LayoutedLikeC4ModelData } from '@likec4/core'
import { ProjectId } from '@likec4/core'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ASSET_MAX_BYTES,
  ASSET_MAX_COUNT,
  ASSET_MAX_TOTAL_BYTES,
  collectAssets,
  collectFileIcons,
  rewriteFileIcons,
} from './assets'
import type { GitProvenance } from './git'
import type { PublishProject } from './payload'
import { buildPublishPayload } from './payload'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__')

/** A committed 112-byte SVG - the hash below is asserted against its bytes, do not edit it. */
const LOGO = join(fixtures, 'assets', 'logo.svg')
const LOGO_SHA256 = 'e4c6eb37275f5b005ebaefa7a180dcf64ed2833b64ad807a464523b701ecc2c2'
const LOGO_BASE64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjM2I4MmY2Ii8+PC9zdmc+Cg=='

const provenance: GitProvenance = {
  origin: 'likec4/likec4',
  sha: 'abc123',
  branch: 'main',
  tag: null,
  commit: {
    message: 'feat: publish',
    author: 'Alice Smith',
    email: 'alice@example.com',
    date: '2026-07-31T10:34:56.000Z',
  },
  root: '/repo',
  dirty: false,
}

/** An empty-but-well-shaped layouted model, to be extended per test. */
function modelData(name: string, extra: Record<string, unknown> = {}): LayoutedLikeC4ModelData {
  const projectId = ProjectId(name)
  return {
    _stage: 'layouted',
    projectId,
    project: { id: projectId, title: name },
    specification: {
      tags: {},
      elements: {},
      deployments: {},
      relationships: {},
    },
    elements: {},
    deployments: { elements: {}, relations: {} },
    relations: {},
    globals: { predicates: {}, dynamicPredicates: {}, styles: {} },
    imports: {},
    views: {},
    ...extra,
  } as LayoutedLikeC4ModelData
}

function project(name: string, data: LayoutedLikeC4ModelData): PublishProject {
  return { name, folder: `/repo/${name}`, data }
}

/** Collected warnings, so the `--force` path can be asserted. */
function fakeLogger() {
  const warnings: string[] = []
  return {
    warnings,
    logger: { warn: (msg: string) => void warnings.push(msg) },
  }
}

describe('collectFileIcons', () => {
  it('finds icons wherever they sit, at any depth', () => {
    const data = modelData('acme', {
      specification: {
        // specification element / tag / deployment kind styles
        elements: { system: { style: { icon: 'file:///icons/system.svg' } } },
        tags: { critical: { style: { icon: 'file:///icons/tag.svg' } } },
        deployments: { node: { style: { icon: 'file:///icons/node.svg' } } },
        relationships: {},
      },
      elements: { 'sys': { id: 'sys', icon: 'file:///icons/element.svg' } },
      deployments: {
        elements: { 'prod': { id: 'prod', icon: 'file:///icons/deployment.svg' } },
        relations: {},
      },
      views: {
        index: {
          id: 'index',
          // a view rule style override - a shape `@likec4/core` may grow more of
          rules: [{ targets: [{ wildcard: true }], style: { icon: 'file:///icons/override.svg' } }],
          nodes: [{ id: 'n1', icon: 'file:///icons/node-in-view.svg' }],
        },
      },
      manualLayouts: {
        index: { nodes: [{ id: 'n1', icon: 'file:///icons/manual.svg' }] },
      },
    })

    expect([...collectFileIcons(data)].sort()).toEqual([
      'file:///icons/deployment.svg',
      'file:///icons/element.svg',
      'file:///icons/manual.svg',
      'file:///icons/node-in-view.svg',
      'file:///icons/node.svg',
      'file:///icons/override.svg',
      'file:///icons/system.svg',
      'file:///icons/tag.svg',
    ])
  })

  it('never looks at anything but the immediate string value of an `icon` key', () => {
    const data = modelData('acme', {
      elements: {
        sys: {
          id: 'sys',
          // arbitrary user text, and a legitimate `file://` hyperlink
          links: [
            { url: 'file:///home/alice/spec.pdf', title: 'Spec' },
            { url: 'https://acme.io' },
          ],
          // not an icon reference either, whatever it looks like
          description: 'file:///icons/looks-like-one.svg',
          notes: { icon: { url: 'file:///icons/nested.svg' } },
        },
      },
    })

    expect(collectFileIcons(data)).toEqual(new Set())
  })

  it('leaves icons that are not local files alone', () => {
    const data = modelData('acme', {
      elements: {
        a: { icon: 'https://acme.io/logo.svg' },
        b: { icon: 'aws:s3' },
        c: { icon: 'none' },
      },
    })

    expect(collectFileIcons(data)).toEqual(new Set())
  })

  it('reports one entry per distinct reference', () => {
    const data = modelData('acme', {
      elements: {
        a: { icon: 'file:///icons/logo.svg' },
        b: { icon: 'file:///icons/logo.svg' },
      },
    })

    expect([...collectFileIcons(data)]).toEqual(['file:///icons/logo.svg'])
  })
})

describe('rewriteFileIcons', () => {
  const rewritten = new Map([['file:///icons/logo.svg', 'asset://deadbeef']])

  it('rewrites an icon under a view rule style override', () => {
    const data = modelData('acme', {
      views: {
        index: {
          id: 'index',
          rules: [{ targets: [{ wildcard: true }], style: { icon: 'file:///icons/logo.svg' } }],
          nodes: [],
        },
      },
    })

    const result = rewriteFileIcons(data, rewritten) as any

    expect(result.views.index.rules[0].style.icon).toBe('asset://deadbeef')
  })

  it('does not touch a links[].url that starts with file://', () => {
    const data = modelData('acme', {
      elements: {
        sys: {
          icon: 'file:///icons/logo.svg',
          links: [{ url: 'file:///home/alice/spec.pdf' }],
        },
      },
    })

    const result = rewriteFileIcons(data, rewritten) as any

    expect(result.elements.sys.icon).toBe('asset://deadbeef')
    expect(result.elements.sys.links[0].url).toBe('file:///home/alice/spec.pdf')
  })

  it('leaves references it was not given, and keeps unchanged subtrees identical', () => {
    const data = modelData('acme', {
      elements: {
        a: { icon: 'file:///icons/logo.svg' },
        b: { icon: 'file:///icons/other.svg' },
      },
    })

    const result = rewriteFileIcons(data, rewritten) as any

    expect(result.elements.b.icon).toBe('file:///icons/other.svg')
    // copy-on-write: the untouched element keeps its identity, the model is not deep-cloned
    expect(result.elements.b).toBe((data as any).elements.b)
    expect(result).not.toBe(data)
  })

  it('returns the input untouched when there is nothing to rewrite', () => {
    const data = modelData('acme', { elements: { a: { icon: 'file:///icons/logo.svg' } } })

    expect(rewriteFileIcons(data, new Map())).toBe(data)
  })
})

describe('collectAssets', () => {
  let tmp: string

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'likec4-assets-'))
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  /** Writes `content` into the temp dir and returns its `file://` url. */
  async function writeIcon(name: string, content: Buffer | string): Promise<string> {
    const path = join(tmp, name)
    await writeFile(path, content)
    return pathToFileURL(path).toString()
  }

  /** A model whose elements carry exactly the given icon references. */
  function withIcons(name: string, icons: string[]): PublishProject {
    return project(
      name,
      modelData(name, {
        elements: Object.fromEntries(icons.map((icon, i) => [`e${i}`, { id: `e${i}`, icon }])),
      }),
    )
  }

  it('hashes the bytes of a known fixture, and inlines them under the basename', async () => {
    const { logger, warnings } = fakeLogger()
    const reference = pathToFileURL(LOGO).toString()

    const collected = await collectAssets({
      projects: [withIcons('acme', [reference])],
      force: false,
      logger,
    })

    expect(collected.assets).toEqual({
      [LOGO_SHA256]: { filename: 'logo.svg', bytes: LOGO_BASE64 },
    })
    expect(collected.totalBytes).toBe(112)
    expect((collected.projects[0]!.data as any).elements.e0.icon).toBe(`asset://${LOGO_SHA256}`)
    // the resolved path never leaves the machine
    expect(JSON.stringify(collected.assets)).not.toContain(dirname(LOGO))
    expect(warnings).toEqual([])
  })

  it('rewrites an icon reference that is percent-encoded', async () => {
    const { logger } = fakeLogger()
    const reference = await writeIcon('my logo.svg', '<svg/>')
    expect(reference).toContain('%20')

    const collected = await collectAssets({
      projects: [withIcons('acme', [reference])],
      force: false,
      logger,
    })

    expect(Object.values(collected.assets)).toEqual([
      { filename: 'my logo.svg', bytes: Buffer.from('<svg/>').toString('base64') },
    ])
  })

  it('collects the same bytes once, however many projects reference them', async () => {
    const { logger } = fakeLogger()
    const a = await writeIcon('a.svg', '<svg id="same"/>')
    const b = await writeIcon('b.svg', '<svg id="same"/>')

    const collected = await collectAssets({
      projects: [withIcons('alpha', [a, b]), withIcons('beta', [a])],
      force: false,
      logger,
    })

    expect(Object.keys(collected.assets)).toHaveLength(1)
    expect(collected.totalBytes).toBe(16)
    const hash = Object.keys(collected.assets)[0]!
    expect((collected.projects[1]!.data as any).elements.e0.icon).toBe(`asset://${hash}`)
  })

  it('collects nothing, and produces no `assets` key, for a project without local icons', async () => {
    const { logger } = fakeLogger()
    const projects = [
      project('acme', modelData('acme', { elements: { a: { icon: 'https://acme.io/logo.svg' } } })),
    ]

    const collected = await collectAssets({ projects, force: false, logger })

    expect(collected.assets).toEqual({})
    expect(collected.totalBytes).toBe(0)
    // unchanged model, and no empty `assets` object in the payload
    expect(collected.projects[0]!.data).toBe(projects[0]!.data)
    const payload = buildPublishPayload({ provenance, projects: collected.projects, assets: collected.assets })
    expect(payload).not.toHaveProperty('assets')
    expect(Object.keys(payload)).not.toContain('assets')
  })

  describe('caps', () => {
    it('fails when a single asset is over 1 MB, naming the file', async () => {
      const { logger } = fakeLogger()
      const reference = await writeIcon('big.png', Buffer.alloc(ASSET_MAX_BYTES + 1))

      await expect(collectAssets({ projects: [withIcons('acme', [reference])], force: false, logger }))
        .rejects.toThrow(
          `"${join(tmp, 'big.png')}" is ${ASSET_MAX_BYTES + 1} bytes, over the ${ASSET_MAX_BYTES} bytes per-asset`,
        )
    })

    it('fails when the assets exceed 10 MB in total, naming the file that breaks it', async () => {
      const { logger } = fakeLogger()
      const oneMb = ASSET_MAX_BYTES
      const references: string[] = []
      for (let i = 0; i < ASSET_MAX_TOTAL_BYTES / oneMb; i++) {
        // distinct content, so each one is a distinct asset
        references.push(await writeIcon(`icon-${i}.png`, Buffer.alloc(oneMb, i)))
      }
      references.push(await writeIcon('one-too-many.png', Buffer.from([0x1])))

      await expect(collectAssets({ projects: [withIcons('acme', references)], force: false, logger }))
        .rejects.toThrow(
          `exceed the ${ASSET_MAX_TOTAL_BYTES} bytes total limit, "${join(tmp, 'one-too-many.png')}"`,
        )
    })

    it('fails above 200 assets, naming the file that breaks it', async () => {
      const { logger } = fakeLogger()
      const references: string[] = []
      for (let i = 0; i <= ASSET_MAX_COUNT; i++) {
        references.push(await writeIcon(`icon-${i}.svg`, `<svg id="${i}"/>`))
      }

      await expect(collectAssets({ projects: [withIcons('acme', references)], force: false, logger }))
        .rejects.toThrow(
          `at most ${ASSET_MAX_COUNT} per publish, "${join(tmp, `icon-${ASSET_MAX_COUNT}.svg`)}"`,
        )
    })

    it('warns and skips the offending file under --force, keeping the rest', async () => {
      const { logger, warnings } = fakeLogger()
      const good = await writeIcon('good.svg', '<svg/>')
      const big = await writeIcon('big.png', Buffer.alloc(ASSET_MAX_BYTES + 1))

      const collected = await collectAssets({
        projects: [withIcons('acme', [good, big])],
        force: true,
        logger,
      })

      expect(Object.keys(collected.assets)).toHaveLength(1)
      const elements = (collected.projects[0]!.data as any).elements
      expect(elements.e0.icon).toMatch(/^asset:\/\/[0-9a-f]{64}$/)
      expect(elements.e1.icon).toBe(big)
      expect(warnings.join('\n')).toContain(join(tmp, 'big.png'))
    })
  })

  describe('unreadable files', () => {
    it('fails naming the missing file and the project that references it', async () => {
      const { logger } = fakeLogger()
      const missing = pathToFileURL(join(tmp, 'gone.svg')).toString()

      const collect = collectAssets({ projects: [withIcons('acme', [missing])], force: false, logger })

      await expect(collect).rejects.toThrow(`Icon file "${join(tmp, 'gone.svg')}" does not exist`)
      await expect(collect).rejects.toThrow(/project "acme"/)
      await expect(collect).rejects.toThrow(/--force/)
    })

    it('warns and keeps the original file:// reference under --force', async () => {
      const { logger, warnings } = fakeLogger()
      const missing = pathToFileURL(join(tmp, 'gone.svg')).toString()

      const collected = await collectAssets({
        projects: [withIcons('acme', [missing])],
        force: true,
        logger,
      })

      expect(collected.assets).toEqual({})
      // the viewer renders nothing for `file:`, so this degrades to the pre-assets behaviour
      // while the bad path stays diagnosable
      expect((collected.projects[0]!.data as any).elements.e0.icon).toBe(missing)
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain(join(tmp, 'gone.svg'))
      expect(warnings[0]).toContain('acme')
    })

    // Windows resolves a host-qualified `file://` url to a UNC path instead of rejecting it,
    // so the host is refused before `fileURLToPath` ever sees it
    it('fails when the reference is not a local file path at all', async () => {
      const { logger } = fakeLogger()

      await expect(
        collectAssets({
          projects: [withIcons('acme', ['file://remote-host/share/logo.svg'])],
          force: false,
          logger,
        }),
      ).rejects.toThrow(/is not a local file path/)
    })

    it('fails when the path cannot be read', async () => {
      const { logger } = fakeLogger()
      // a directory is readable as a path but not as a file
      const reference = pathToFileURL(tmp).toString()

      await expect(collectAssets({ projects: [withIcons('acme', [reference])], force: false, logger }))
        .rejects.toThrow(/could not be read \(EISDIR\)/)
    })

    it('reports a reference shared by several projects only once', async () => {
      const { logger, warnings } = fakeLogger()
      const missing = pathToFileURL(join(tmp, 'gone.svg')).toString()

      await collectAssets({
        projects: [withIcons('alpha', [missing]), withIcons('beta', [missing])],
        force: true,
        logger,
      })

      expect(warnings).toHaveLength(1)
    })
  })
})
