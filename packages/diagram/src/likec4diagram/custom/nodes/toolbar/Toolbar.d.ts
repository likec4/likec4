import { type NodeToolbarProps } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { BaseNodeProps } from '../../../../base/types';
export type ToolbarProps = Omit<NodeToolbarProps, 'title'> & {
    nodeProps: BaseNodeProps;
    title: ReactNode;
};
export declare function Toolbar({ title, children, nodeProps, ...props }: ToolbarProps): import("react").JSX.Element;
