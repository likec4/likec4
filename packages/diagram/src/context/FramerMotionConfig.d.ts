import type { PropsWithChildren } from 'react';
export declare const FramerMotionConfig: ({ reducedMotion, children, }: PropsWithChildren<{
    /**
     * If true, will respect the device prefersReducedMotion setting by switching
     * transform animations off.
     */
    reducedMotion?: "always" | "never" | "user" | undefined;
}>) => import("react").JSX.Element;
