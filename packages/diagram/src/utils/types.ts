import type { Merge } from "type-fest";
import type { Node } from '@xyflow/react'

export type AddNodeData<T extends Node, Data> = Omit<T, "data"> & { data: Merge<T["data"], Data> }
