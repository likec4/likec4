import type { PropsWithChildren } from 'react';
import type { JSX } from 'react/jsx-runtime';
import type { Simplify } from 'type-fest';
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props';
export type LikeC4DiagramXYFlowProps = PropsWithChildren<Simplify<Pick<LikeC4DiagramProperties<any>, 'background' | 'reactFlowProps' | 'renderNodes'>>>;
export declare function LikeC4DiagramXYFlow({ background, reactFlowProps, children, renderNodes, }: LikeC4DiagramXYFlowProps): JSX.Element;
