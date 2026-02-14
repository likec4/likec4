import type { Fqn, NodeId, ViewId } from '@likec4/core/types';
import type { Rect } from '@xyflow/system';
type ElementDetailsCardProps = {
    viewId: ViewId;
    fromNode: NodeId | null;
    rectFromNode: Rect | null;
    onClose: () => void;
    fqn: Fqn;
};
export declare function ElementDetailsCard({ viewId, fromNode, rectFromNode, fqn, onClose, }: ElementDetailsCardProps): import("react").JSX.Element;
export {};
