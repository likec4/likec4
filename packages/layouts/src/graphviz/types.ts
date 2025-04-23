import type { DiagramView } from '@likec4/core'
import type { $keywords } from 'ts-graphviz'
import type { Tagged } from 'type-fest'

// Declare custom attributes.
declare module 'ts-graphviz' {
  export namespace GraphAttributeKey {
    export interface $values extends $keywords<'likec4_viewId'> {}
  }
  export namespace ClusterSubgraphAttributeKey {
    export interface $values
      extends $keywords<'likec4_type' | 'likec4_path' | 'likec4_id' | 'likec4_level' | 'likec4_depth'>
    {}
  }

  export namespace NodeAttributeKey {
    export interface $values extends $keywords<'likec4_type' | 'likec4_path' | 'likec4_id' | 'likec4_level'> {}
  }

  export namespace EdgeAttributeKey {
    export interface $values extends $keywords<'likec4_id'> {}
  }

  export namespace Attribute {
    export interface $keys
      extends $keywords<'likec4_viewId' | 'likec4_type' | 'likec4_path' | 'likec4_id' | 'likec4_level' | 'likec4_depth'>
    {}

    export interface $types {
      likec4_viewId: string
      likec4_type: 'folder' | 'file' | 'view'
      likec4_path: string
      likec4_id: string
      likec4_level: number
      likec4_depth: number
    }
  }
}

export type DotSource = Tagged<string, 'DotSource'>

export type DotLayoutResult = {
  dot: DotSource
  diagram: DiagramView
}
