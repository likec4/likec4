import type { BaseNodePropsWithData } from '../../../base/types';
import type { Types } from '../../types';
type RequiredData = Pick<Types.NodeData, 'id' | 'notes' | 'width' | 'height' | 'x' | 'y'>;
export type NodeNotesProps = BaseNodePropsWithData<RequiredData>;
export declare function NodeNotes({ data }: NodeNotesProps): import("react").JSX.Element;
export {};
