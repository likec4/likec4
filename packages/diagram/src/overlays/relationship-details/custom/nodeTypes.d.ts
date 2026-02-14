import type { BaseNodePropsWithData } from '../../../base';
import type { RelationshipDetailsTypes } from '../_types';
export declare const ElementNode: import("react").FunctionComponent<RelationshipDetailsTypes.NodeProps<"element">>;
export declare const CompoundNode: import("react").FunctionComponent<RelationshipDetailsTypes.NodeProps<"compound">>;
type ElementPortsProps = BaseNodePropsWithData<Pick<RelationshipDetailsTypes.ElementNodeData, 'ports' | 'height'>>;
export declare const ElementPorts: ({ data: { ports, height: h } }: ElementPortsProps) => import("react").JSX.Element;
type CompoundPortsProps = BaseNodePropsWithData<Pick<RelationshipDetailsTypes.CompoundNodeData, 'ports'>>;
export declare const CompoundPorts: ({ data }: CompoundPortsProps) => import("react").JSX.Element;
export {};
