import { type BackgroundProps } from '@xyflow/react';
export type XYBackgroundVariant = 'dots' | 'lines' | 'cross';
export type XYBackground = XYBackgroundVariant | BackgroundProps;
export type XYBackgroundProps = {
    background: XYBackground;
};
export declare const Background: import("react").NamedExoticComponent<XYBackgroundProps>;
