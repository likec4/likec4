import { type HTMLAttributes } from 'react';
export declare const ShadowRoot: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & {
    injectFontCss?: boolean | undefined;
    styleNonce?: string | (() => string) | undefined;
    mode?: "open" | "closed";
    delegatesFocus?: boolean;
    colorScheme?: "light" | "dark" | undefined;
    keepAspectRatio?: false | undefined | {
        width: number;
        height: number;
    };
    /**
     * Mantine theme override to apply within the shadow root
     * @see https://mantine.dev/theming/mantine-provider/#theme-prop
     */
    theme?: any;
} & import("react").RefAttributes<HTMLDivElement>>;
