import type { Fqn } from '@likec4/core';
import type { BaseNodeData } from '../../../base/types';
import type { Types } from '../../types';
export declare function ElementDetailsButtonWithHandler(props: {
    id: string;
    selected?: boolean;
    data: BaseNodeData & {
        modelFqn?: Fqn | null | undefined;
    };
}): import("react").JSX.Element;
export declare function CompoundDetailsButtonWithHandler(props: Types.NodeProps<'compound-deployment' | 'compound-element'>): import("react").JSX.Element;
/**
 * Renders an element node.
 */
export declare function ElementNode(props: Types.NodeProps<'element'>): import("react").JSX.Element;
export declare function DeploymentNode(props: Types.NodeProps<'deployment'>): import("react").JSX.Element;
export declare function CompoundElementNode(props: Types.NodeProps<'compound-element'>): import("react").JSX.Element;
export declare function CompoundDeploymentNode(props: Types.NodeProps<'compound-deployment'>): import("react").JSX.Element;
export declare function ViewGroupNode(props: Types.NodeProps<'view-group'>): import("react").JSX.Element;
