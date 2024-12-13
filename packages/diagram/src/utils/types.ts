import type { Merge } from "type-fest";
import type { Edge, Node } from '@xyflow/react'

export type AddNodeData<T extends Node, Data> = Omit<T, "data"> & { data: Merge<T["data"], Data> }

export type AddEdgeData<T extends Edge, Data> = Omit<T, "data"> & { data: Merge<T["data"], Data> }
