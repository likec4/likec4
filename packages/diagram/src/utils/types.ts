import type { Edge, Node } from '@xyflow/react'
import type { Merge } from 'type-fest'

export type AddNodeData<T extends Node, Data> = Omit<T, 'data'> & { data: Merge<T['data'], Data> }

export type AddEdgeData<T extends Edge, Data> = Omit<T, 'data'> & { data: Merge<T['data'], Data> }
