import { type TagSpecification } from '@likec4/core';
import { type PropsWithChildren } from 'react';
export declare function TagStylesProvider({ children, rootSelector }: PropsWithChildren<{
    rootSelector: string;
}>): import("react").JSX.Element;
export declare function useTagSpecifications(): Record<string, TagSpecification>;
export declare function useTagSpecification(tag: string): TagSpecification;
