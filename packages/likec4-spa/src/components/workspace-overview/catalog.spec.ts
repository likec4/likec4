import type { LayoutedProjectsView } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { buildProjectsCatalog, monogramColor, projectInitials, selectProjects } from './catalog'

type ViewNode = LayoutedProjectsView['nodes'][number]
type ViewEdge = LayoutedProjectsView['edges'][number]

function node(id: string, title: string, metrics?: ViewNode['metrics']): ViewNode {
  // only the fields the catalog reads are relevant
  return { id: `n-${id}`, projectId: id, title, ...(metrics && { metrics }) } as unknown as ViewNode
}

function edge(from: string, to: string, relations: number): ViewEdge {
  return {
    id: `${from}->${to}`,
    source: `n-${from}`,
    target: `n-${to}`,
    projectId: from,
    relations: Array.from({ length: relations }, (_, i) => `r${i}`),
  } as unknown as ViewEdge
}

function view(nodes: ViewNode[], edges: ViewEdge[]): LayoutedProjectsView {
  return { nodes, edges } as unknown as LayoutedProjectsView
}

describe('buildProjectsCatalog', () => {
  const catalog = buildProjectsCatalog(view(
    [
      node('shop', 'Storefront', { elements: 10, relationships: 4, views: 2 }),
      node('pay', 'Checkout', { elements: 20, relationships: 7, views: 3 }),
      node('auth', 'Identity', { elements: 5, relationships: 1, views: 1 }),
    ],
    [
      edge('shop', 'pay', 3),
      edge('shop', 'auth', 5),
      edge('pay', 'auth', 2),
    ],
  ))

  it('collects links in both directions, most relationships first', () => {
    const shop = catalog.projects.find(p => p.id === 'shop')
    expect(shop?.dependsOn.map(l => [l.projectId, l.relationships])).toEqual([['auth', 5], ['pay', 3]])
    expect(shop?.usedBy).toEqual([])

    const auth = catalog.projects.find(p => p.id === 'auth')
    expect(auth?.usedBy.map(l => [l.title, l.relationships])).toEqual([['Storefront', 5], ['Checkout', 2]])
  })

  it('sums workspace totals', () => {
    expect(catalog.totals).toEqual({ projects: 3, elements: 35, views: 6 })
  })

  it('reports unknown totals when metrics are missing', () => {
    const legacy = buildProjectsCatalog(
      view([node('a', 'A'), node('b', 'B', { elements: 1, relationships: 0, views: 0 })], []),
    )
    expect(legacy.projects[0]?.elements).toBeNull()
    expect(legacy.totals.elements).toBeNull()
  })

  it('sorts', () => {
    expect(selectProjects(catalog.projects, 'name').map(p => p.id)).toEqual(['pay', 'auth', 'shop'])
    expect(selectProjects(catalog.projects, 'elements').map(p => p.id)).toEqual(['pay', 'shop', 'auth'])
    expect(selectProjects(catalog.projects, 'usedBy').map(p => p.id)).toEqual(['auth', 'pay', 'shop'])
  })
})

describe('projectInitials', () => {
  it('uses first letters of two words, or the first two letters', () => {
    expect(projectInitials('Identity & Access')).toBe('IA')
    expect(projectInitials('data-platform')).toBe('DP')
    expect(projectInitials('checkout')).toBe('CH')
  })
})

describe('monogramColor', () => {
  it('is stable per id', () => {
    expect(monogramColor('checkout')).toBe(monogramColor('checkout'))
  })
})
