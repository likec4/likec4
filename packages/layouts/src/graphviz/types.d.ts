import type { DiagramView } from '@likec4/core';
import type { $keywords } from 'ts-graphviz';
import type { Tagged } from 'type-fest';
/**
 * Partially implements CancellationToken interface from vscode-jsonrpc
 */
export type CancellationToken = {
    /**
     * Is `true` when the token has been cancelled, `false` otherwise.
     */
    readonly isCancellationRequested: boolean;
};
declare module 'ts-graphviz' {
    namespace GraphAttributeKey {
        interface $values extends $keywords<'likec4_viewId'> {
        }
    }
    namespace ClusterSubgraphAttributeKey {
        interface $values extends $keywords<'likec4_type' | 'likec4_path' | 'likec4_id' | 'likec4_level' | 'likec4_depth'> {
        }
    }
    namespace NodeAttributeKey {
        interface $values extends $keywords<'likec4_type' | 'likec4_path' | 'likec4_id' | 'likec4_project' | 'likec4_level'> {
        }
    }
    namespace EdgeAttributeKey {
        interface $values extends $keywords<'likec4_id' | 'likec4_project'> {
        }
    }
    namespace Attribute {
        interface $keys extends $keywords<'likec4_viewId' | 'likec4_type' | 'likec4_path' | 'likec4_id' | 'likec4_project' | 'likec4_level' | 'likec4_depth'> {
        }
        interface $types {
            likec4_viewId: string;
            likec4_type: 'folder' | 'file' | 'view';
            likec4_path: string;
            likec4_id: string;
            likec4_project: string;
            likec4_level: number;
            likec4_depth: number;
        }
    }
}
export type DotSource = Tagged<string, 'DotSource'>;
export type DotLayoutResult = {
    dot: DotSource;
    diagram: DiagramView;
};
