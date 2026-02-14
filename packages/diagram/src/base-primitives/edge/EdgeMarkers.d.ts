import type { RelationshipArrowType } from '@likec4/core/types';
import type { SVGProps } from 'react';
export declare const EdgeMarkers: {
    Arrow: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    Crow: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    OArrow: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    Open: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    Diamond: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    ODiamond: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    Dot: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
    ODot: (props: SVGProps<SVGMarkerElement>) => import("react").JSX.Element;
};
export type EdgeMarkerType = keyof typeof EdgeMarkers;
export declare function arrowTypeToMarker(arrowType?: RelationshipArrowType): EdgeMarkerType | undefined;
