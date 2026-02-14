import { type RecipeVariantProps } from '@likec4/styles/css';
import type { MouseEventHandler, PropsWithChildren } from 'react';
import { IconOrShapeRenderer } from '../../context/IconRenderer';
import type { TreeNodeData } from '../useElementsTree';
declare const statebtn: any;
declare const tree: any;
export type TreeVariants = RecipeVariantProps<typeof tree>;
export declare const Tree: {
    Root: any;
    Branch: any;
    Item: any;
    Control: any;
    State: ({ node, state, onClick, className, ...props }: PropsWithChildren<RecipeVariantProps<typeof statebtn> & {
        node: TreeNodeData;
        className?: string;
        onClick?: MouseEventHandler<HTMLElement>;
    }>) => import("react").JSX.Element;
    Icon: typeof IconOrShapeRenderer;
    Label: any;
    Content: any;
    Indicator: any;
};
export {};
