import dagre from '@dagrejs/dagre'

const Graph = dagre.graphlib.Graph

export { Graph }

export const topsort = dagre.graphlib.alg.topsort
export const postorder = dagre.graphlib.alg.postorder
export const findCycles = dagre.graphlib.alg.findCycles
export const isAcyclic = dagre.graphlib.alg.isAcyclic
