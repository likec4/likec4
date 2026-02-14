import { type FunctionComponent } from 'react';
import type { BaseNodeProps } from '../base/types';
export declare function memoNode<P extends BaseNodeProps>(Node: FunctionComponent<P>, displayName?: string): FunctionComponent<P>;
