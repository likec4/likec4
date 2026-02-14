import type { LayoutedProjectEdge } from '@likec4/core/compute-view';
import type { DiagramNode, ExclusiveUnion, ProjectId } from '@likec4/core/types';
import type { ReactFlowInstance, ReactFlowState } from '@xyflow/react';
import type { FunctionComponent } from 'react';
import type { Simplify } from 'type-fest';
import type { BaseEdge, BaseEdgeData, BaseEdgeProps, BaseNode, BaseNodeData, BaseNodeProps, NonOptional } from '../base/types';
export declare namespace ProjectsOverviewTypes {
    type ProjectNodeData = Simplify<BaseNodeData & NonOptional<Pick<DiagramNode, 'id' | 'title' | 'color' | 'shape' | 'style' | 'width' | 'height'>> & {
        projectId: ProjectId;
    }>;
    type ProjectNode = BaseNode<ProjectNodeData, 'project'>;
    type AnyNode = ProjectNode;
    type NodeType = AnyNode['type'];
    type Node<T extends NodeType = NodeType> = Extract<AnyNode, {
        type: T;
    }>;
    type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>;
    type NodeData = ExclusiveUnion<{
        ProjectNodeData: ProjectNodeData;
    }>;
    type NodeRenderer<T extends NodeType = NodeType> = FunctionComponent<NodeProps<T>>;
    type NodeRenderers = {
        [T in NodeType]: NodeRenderer<T>;
    };
    type EdgeData = Simplify<BaseEdgeData & NonOptional<Pick<LayoutedProjectEdge, 'id' | 'label' | 'labelBBox' | 'technology' | 'projectId' | 'points' | 'color' | 'line'>>>;
    type Edge = BaseEdge<EdgeData, 'relationship'>;
    type EdgeProps = BaseEdgeProps<Edge>;
}
export type ProjectsOverviewXYFLowInstance = ReactFlowInstance<ProjectsOverviewTypes.Node, ProjectsOverviewTypes.Edge>;
export type ProjectsOverviewXYStoreState = ReactFlowState<ProjectsOverviewTypes.Node, ProjectsOverviewTypes.Edge>;
export type ProjectsOverviewXYStoreApi = {
    getState: () => ProjectsOverviewXYStoreState;
    setState: (state: ProjectsOverviewXYStoreState) => void;
};
