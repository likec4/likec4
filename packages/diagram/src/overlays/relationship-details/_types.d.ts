import type { Color, DiagramNode, ExclusiveUnion, Fqn, IconUrl, MarkdownOrString, RelationId, RelationshipArrowType, RelationshipLineType, ViewId } from '@likec4/core/types';
import type { FunctionComponent } from 'react';
import type { Simplify } from 'type-fest';
import type { BaseEdge, BaseEdgeData, BaseEdgeProps, BaseNode, BaseNodeData, BaseNodeProps, NonOptional } from '../../base/types';
export declare namespace RelationshipDetailsTypes {
    type Column = 'sources' | 'targets';
    /**
     * The node's incoming and outgoing ports
     */
    type Ports = {
        in: string[];
        out: string[];
    };
    type ElementNodeData = Simplify<BaseNodeData & NonOptional<Pick<DiagramNode, 'id' | 'title' | 'technology' | 'description' | 'color' | 'shape' | 'width' | 'height' | 'navigateTo' | 'style' | 'tags'>> & {
        column: Column;
        fqn: Fqn;
        icon: IconUrl;
        ports: Ports;
    }>;
    type CompoundNodeData = Simplify<BaseNodeData & NonOptional<Pick<DiagramNode, 'id' | 'title' | 'color' | 'style'>> & {
        column: Column;
        fqn: Fqn;
        depth: number;
        icon?: IconUrl;
        ports: Ports;
    }>;
    type ElementNode = BaseNode<ElementNodeData, 'element'>;
    type CompoundNode = BaseNode<CompoundNodeData, 'compound'>;
    type AnyNode = ElementNode | CompoundNode;
    type NodeType = AnyNode['type'];
    type Node<T extends NodeType = NodeType> = Extract<AnyNode, {
        type: T;
    }>;
    type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>;
    type NodeData = ExclusiveUnion<{
        ElementNodeData: ElementNodeData;
        CompoundNodeData: CompoundNodeData;
    }>;
    type NodeRenderer<T extends NodeType = NodeType> = FunctionComponent<NodeProps<T>>;
    type NodeRenderers = {
        element: NodeRenderer<'element'>;
        compound: NodeRenderer<'compound'>;
    };
    type EdgeData = Simplify<BaseEdgeData & {
        relationId: RelationId;
        color: Color;
        label: string | null;
        technology?: string | undefined;
        navigateTo: ViewId | null;
        line: RelationshipLineType;
        head?: RelationshipArrowType;
        tail?: RelationshipArrowType;
        description: MarkdownOrString | null;
    }>;
    type Edge = BaseEdge<EdgeData, 'relationship'>;
    type EdgeProps = BaseEdgeProps<Edge>;
}
