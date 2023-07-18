import type { ElementView, expression as Expr, Fqn, WildcardExpr } from '@likec4/core'
import { invariant, Relations, type RelationID, type Relation, isSameHierarchy } from '@likec4/core'
import { type ElementRefExpr } from '@likec4/core'
import type cytoscape from 'cytoscape'
import type { NodeCollection, NodeSingular } from 'cytoscape'

type CyEdgeData = {
  id: RelationID
  source: Fqn
  target: Fqn
}

function withDescendants(n: NodeSingular) {
  // const s = cy.collection()
  return n.union(n.descendants())
  // return s.merge(n).merge(n.descendants())
}

function compoudNeighborhood(n: NodeSingular) {
  // const s = cy.collection()
  const elementFqn = n.id() as Fqn
  const isAnyInOut = Relations.isAnyInOut(elementFqn)
  const edges = n
    .union(n.descendants())
    .connectedEdges()
    .filter(edge => {
      return isAnyInOut(edge.data() as Relation)
    })

  const nodes = edges
    .connectedNodes()
    .filter(node => !isSameHierarchy(node.id() as Fqn, elementFqn))

  return edges.merge(nodes)
  // return n.merge(n.descendants()).neighborhood().filter(node => !isSameHierarchy(node.id() as Fqn, elementFqn))
}

export function includeElementRef(cy: cytoscape.Core, expr: ElementRefExpr) {
  const exprElement = cy.getElementById(expr.element).first()
  invariant(exprElement.isNode(), `Element with ID ${expr.element} does not exist or is not a node`)
  const elements = expr.isDescedants ? exprElement.children() : exprElement
  elements.select().forEach(nd => {
    compoudNeighborhood(nd).addClass('implicit')
  })
  return cy
}

export function excludeElementRef(cy: cytoscape.Core, expr: ElementRefExpr) {
  const exprElement = cy.getElementById(expr.element).first()
  invariant(exprElement.isNode(), `Element with ID ${expr.element} does not exist or is not a node`)
  const elements = expr.isDescedants ? exprElement.children() : exprElement
  elements.deselect().descendants('').removeClass('implicit')
  return cy
}

export function includeWildcardExpr(cy: cytoscape.Core, expr: WildcardExpr, view: ElementView) {
  if (view.viewOf) {
    const exprElement = cy.getElementById(view.viewOf).first()
    invariant(
      exprElement.isNode(),
      `Element with ID ${expr.element} does not exist or is not a node`
    )
    exprElement
      .children()
      .select()
      .forEach(nd => {
        compoudNeighborhood(nd).addClass('implicit')
      })
    exprElement.select().neighborhood().addClass('implicit')
    return cy
  }

  cy.nodes().orphans().select()
  return cy
}
