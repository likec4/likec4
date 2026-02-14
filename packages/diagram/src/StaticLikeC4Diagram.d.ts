import type { Any, UnknownLayouted } from '@likec4/core/types';
import type { JSX } from 'react/jsx-runtime';
import type { LikeC4DiagramProperties } from './LikeC4Diagram.props';
export type StaticLikeC4DiagramProps<A extends Any> = Pick<LikeC4DiagramProperties<A>, 'view' | 'className' | 'fitView' | 'fitViewPadding' | 'background' | 'enableElementDetails' | 'enableRelationshipDetails' | 'enableRelationshipBrowser' | 'enableElementTags' | 'reduceGraphics' | 'initialWidth' | 'initialHeight' | 'renderIcon' | 'renderNodes' | 'dynamicViewVariant' | 'where'>;
/**
 * StaticLikeC4Diagram is a component that renders a LikeC4 diagram in a static way.
 * (Export/Embed)
 *
 * @internal
 */
export declare function StaticLikeC4Diagram<A extends Any = UnknownLayouted>({ view, fitView, fitViewPadding, enableRelationshipDetails, enableRelationshipBrowser, background, className, ...rest }: StaticLikeC4DiagramProps<A>): JSX.Element;
