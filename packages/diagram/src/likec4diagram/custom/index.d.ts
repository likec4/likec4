import { SequenceStepEdge } from './edges/SequenceStepEdge';
import { CompoundDeploymentNode, CompoundElementNode, DeploymentNode, ElementNode, SequenceActorNode, SequenceParallelArea, ViewGroupNode } from './nodes';
export declare const BuiltinNodes: {
    ElementNode: typeof ElementNode;
    DeploymentNode: typeof DeploymentNode;
    CompoundElementNode: typeof CompoundElementNode;
    CompoundDeploymentNode: typeof CompoundDeploymentNode;
    ViewGroupNode: typeof ViewGroupNode;
    SequenceActorNode: typeof SequenceActorNode;
    SequenceParallelArea: typeof SequenceParallelArea;
};
export declare const BuiltinEdges: {
    RelationshipEdge: import("react").FunctionComponent<import("../types").Types.EdgeProps<"relationship">>;
    SequenceStepEdge: typeof SequenceStepEdge;
};
