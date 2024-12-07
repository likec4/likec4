import dagre from '@dagrejs/dagre'

const Graph = dagre.graphlib.Graph

export { Graph }

export const postorder = dagre.graphlib.alg.postorder
export const preorder = dagre.graphlib.alg.preorder
export const findCycles = dagre.graphlib.alg.findCycles
export const isAcyclic = dagre.graphlib.alg.isAcyclic
