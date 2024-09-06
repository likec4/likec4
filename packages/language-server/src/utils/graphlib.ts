// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it

import { Graph } from '@dagrejs/graphlib'
import graphlib from '@dagrejs/graphlib'

export { Graph }

export const postorder = graphlib.alg.postorder
export const findCycles = graphlib.alg.findCycles
export const isAcyclic = graphlib.alg.isAcyclic
