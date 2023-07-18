import type { ViewID } from '@likec4/core'
import { parentFqn, type Element, type ElementView, type Relation, invariant } from '@likec4/core'
import cytoscape from 'cytoscape'

type Params = {
  elements: Element[]
  relations: Relation[]
  views: ElementView[]
}

export class LikeC4Graph {
  #cy = cytoscape({
    container: null,
    // styleEnabled: false,
    headless: true,
    layout: {
      name: 'null'
    }
  })

  #views: Map<ViewID, ElementView>

  constructor({ elements, relations, views }: Params) {
    this.#cy.add(
      elements.map(e => {
        const parent = parentFqn(e.id)
        return {
          data: {
            id: e.id.toString(),
            label: e.title,
            ...(parent ? { parent } : {})
          }
        }
      })
    )

    this.#cy.add(
      relations.map(r => ({
        data: {
          id: r.id,
          source: r.source,
          target: r.target,
          label: r.title
        }
      }))
    )

    this.#views = new Map(views.map(v => [v.id, v]))
  }

  computeView(viewId: ViewID) {
    const view = this.#views.get(viewId)
    invariant(view, `View ${viewId} not found`)

    const nodes = view.rules
      .filter(r => r.kind === 'node')
      .map(r => r.selector)
      .map(selector => this.#cy.$('[id="' + selector + '"]'))

    const edges = view.rules
      .filter(r => r.kind === 'edge')
      .map(r => r.selector)
      .map(selector => this.#cy.$('[id="' + selector + '"]'))

    return {
      nodes,
      edges
    }
  }
}
