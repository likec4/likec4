import type { BaseNodePropsWithData } from '../../../base';
import type { RelationshipsBrowserTypes } from '../_types';
export declare function ElementNode(props: RelationshipsBrowserTypes.NodeProps<'element'>): import("react").JSX.Element;
export declare function CompoundNode(props: RelationshipsBrowserTypes.NodeProps<'compound'>): import("react").JSX.Element;
type ElementPortsProps = BaseNodePropsWithData<Pick<RelationshipsBrowserTypes.ElementNodeData, 'ports' | 'height'>>;
export declare const ElementPorts: ({ data: { ports, height: h } }: ElementPortsProps) => import("react").JSX.Element;
type CompoundPortsProps = BaseNodePropsWithData<Pick<RelationshipsBrowserTypes.CompoundNodeData, 'ports'>>;
export declare const CompoundPorts: ({ data }: CompoundPortsProps) => import("react").JSX.Element;
export {};
