import type { ComputedView, ViewId } from '@likec4/core'
import { defaultTheme as Theme } from '@likec4/core'
import { isTruthy } from 'remeda'
import type { GraphBaseModel, RootGraphModel, SubgraphModel } from 'ts-graphviz'
import { attribute as _, strict, toDot as modelToDot } from 'ts-graphviz'
import type { DotSource } from './types'
import { pxToInch, pxToPoints } from './utils'

const FontName = Theme.font

const Sep = '/'

export class OverviewDiagramsPrinter {
  static toDot(views: ComputedView[]): DotSource {
    return new OverviewDiagramsPrinter(views).print()
  }
  private subgraphs = new Map<string, SubgraphModel>()

  public readonly graphvizModel: RootGraphModel

  constructor(views: ComputedView[]) {
    const G = this.graphvizModel = strict.graph({
      [_.layout]: 'osage',
      [_.pack]: pxToPoints(100),
      [_.packmode]: 'array_ltc',
      [_.pad]: pxToInch(15),
      [_.fontname]: FontName,
      [_.splines]: 'polyline',
      [_.esep]: '+20'
    })
    G.attributes.graph.apply({
      [_.fontsize]: pxToPoints(20),
      [_.labeljust]: 'l',
      [_.labelloc]: 't'
    })
    G.attributes.node.apply({
      [_.fontname]: FontName,
      [_.shape]: 'rect',
      [_.width]: pxToInch(400),
      [_.height]: pxToInch(300),
      [_.fixedsize]: true,
      [_.fontsize]: 10
    })
    G.attributes.edge.apply({
      [_.penwidth]: pxToPoints(2)
    })
    const relativePaths = new Set(views.map(view => view.relativePath ?? ''))
    // from -> navigateTo[]
    let maxDepth = 0
    let sortedViews = [...views]
    const hasDifferentPaths = relativePaths.size > 1
    if (hasDifferentPaths) {
      sortedViews.sort((a, b) => {
        const segmentsA = a.relativePath?.split(Sep) ?? ['']
        const segmentsB = b.relativePath?.split(Sep) ?? ['']
        segmentsA.push(a.title ?? 'Untitled')
        segmentsB.push(b.title ?? 'Untitled')
        const depthA = segmentsA.length
        const depthB = segmentsB.length
        maxDepth = Math.max(maxDepth, depthA, depthB)
        switch (true) {
          case depthA > depthB: {
            return -1
          }
          case depthA < depthB: {
            return 1
          }
          default: {
            for (let i = 0; i < depthA; i++) {
              const compare = segmentsA[i]!.localeCompare(segmentsB[i]!)
              if (compare !== 0) {
                return compare
              }
            }
            return 0
          }
        }
      })
    }
    const edges = new Map<ViewId, Set<ViewId>>()
    sortedViews.forEach((view, i) => {
      this.addView(
        hasDifferentPaths ? view : { ...view, relativePath: '' },
        i + maxDepth
      )
      // accumulate edges
      const navigateTo = view.nodes.reduce((acc, node) => {
        if (node.navigateTo) {
          acc.add(node.navigateTo)
        }
        return acc
      }, new Set<ViewId>())
      if (navigateTo.size > 0) {
        edges.set(view.id, navigateTo)
      }
    })

    for (const [from, tos] of edges) {
      for (const to of tos) {
        G.edge([from, to])
      }
    }
  }

  protected getParentForPath(path: string): GraphBaseModel {
    if (path === '') {
      return this.graphvizModel
    }
    const pathlowercase = path.toLowerCase()
    let subgraph = this.subgraphs.get(pathlowercase)
    if (!subgraph) {
      const isFile = pathlowercase.endsWith('.c4') || pathlowercase.endsWith('.likec4')
      const parentPath = path.includes(Sep) ? path.slice(0, path.lastIndexOf(Sep)) : ''
      const parent = this.getParentForPath(parentPath)
      subgraph = parent.subgraph('cluster' + String(this.subgraphs.size + 1), {
        [_.likec4_type]: isFile ? 'file' : 'folder',
        [_.likec4_path]: path,
        [_.sortv]: this.subgraphs.size,
        [_.label]: isTruthy(parentPath) ? path.slice(parentPath.length + 1) : path
      })
      this.subgraphs.set(pathlowercase, subgraph)
    }
    return subgraph
  }

  protected addView(view: ComputedView, sortv = 0) {
    const parent = this.getParentForPath(view.relativePath ?? '')
    return parent.node(view.id, {
      [_.likec4_type]: 'view',
      [_.likec4_id]: view.id,
      [_.sortv]: sortv,
      [_.label]: view.title || 'Untitled'
    })
  }

  public print(): DotSource {
    return modelToDot(this.graphvizModel, {
      print: {
        indentStyle: 'space',
        indentSize: 2
      }
    }) as DotSource
  }
}
