import type { Color, DiagramNode, ExclusiveUnion, Fqn, IconUrl, NonEmptyArray, RelationId, RelationshipArrowType, RelationshipLineType, ViewId } from '@likec4/core/types';
import type { FunctionComponent } from 'react';
import type { Simplify } from 'type-fest';
import type { BaseEdge, BaseEdgeData, BaseEdgeProps, BaseNode, BaseNodeData, BaseNodeProps, NonOptional } from '../../base/types';
export declare namespace RelationshipsBrowserTypes {
    type Column = 'incomers' | 'subjects' | 'outgoers';
    /**
     * The node's incoming and outgoing ports
     */
    type Ports = {
        in: string[];
        out: string[];
    };
    type ElementNodeData = Simplify<BaseNodeData & NonOptional<Pick<DiagramNode, 'id' | 'title' | 'technology' | 'description' | 'color' | 'shape' | 'style' | 'width' | 'height' | 'tags' | 'navigateTo'>> & {
        column: Column;
        fqn: Fqn;
        icon: string | null;
        ports: Ports;
        existsInCurrentView: boolean;
    }>;
    type CompoundNodeData = Simplify<BaseNodeData & NonOptional<Pick<DiagramNode, 'id' | 'title' | 'color' | 'shape' | 'style'>> & {
        column: Column;
        fqn: Fqn;
        depth: number;
        icon: IconUrl;
        ports: Ports;
        existsInCurrentView: boolean;
    }>;
    type EmptyNodeData = BaseNodeData & {
        column: Column;
    };
    type ElementNode = BaseNode<ElementNodeData, 'element'>;
    type CompoundNode = BaseNode<CompoundNodeData, 'compound'>;
    type EmptyNode = BaseNode<EmptyNodeData, 'empty'>;
    type AnyNode = ElementNode | CompoundNode | EmptyNode;
    type NodeType = AnyNode['type'];
    type Node<T extends NodeType = NodeType> = Extract<AnyNode, {
        type: T;
    }>;
    type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>;
    type NodeData = ExclusiveUnion<{
        ElementNodeData: ElementNodeData;
        CompoundNodeData: CompoundNodeData;
        EmptyNodeData: EmptyNodeData;
    }>;
    type NodeRenderer<T extends NodeType = NodeType> = FunctionComponent<NodeProps<T>>;
    type NodeRenderers = {
        [T in NodeType]: NodeRenderer<T>;
    };
    type EdgeData = Simplify<BaseEdgeData & {
        sourceFqn: Fqn;
        targetFqn: Fqn;
        relations: NonEmptyArray<RelationId>;
        color: Color;
        label: string | null;
        navigateTo: ViewId | null;
        line: RelationshipLineType;
        head?: RelationshipArrowType;
        tail?: RelationshipArrowType;
        existsInCurrentView: boolean;
    }>;
    type Edge = BaseEdge<EdgeData, 'relationship'>;
    type EdgeProps = BaseEdgeProps<Edge>;
}
