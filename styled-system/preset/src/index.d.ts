import * as recipes from './recipes/index.ts';
import * as slotRecipes from './stot-recipes/index.ts';
export declare const theme: {
    breakpoints: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    textStyles: {
        readonly dimmed: {
            readonly DEFAULT: {
                readonly description: "Text style for dimmed content";
                readonly value: {
                    readonly fontSize: "md";
                    readonly lineHeight: "md";
                    readonly color: "text.dimmed";
                };
            };
            readonly xxs: {
                readonly value: {
                    readonly fontSize: "xxs";
                    readonly lineHeight: "xxs";
                    readonly color: "text.dimmed";
                };
            };
            readonly xs: {
                readonly value: {
                    readonly fontSize: "xs";
                    readonly lineHeight: "xs";
                    readonly color: "text.dimmed";
                };
            };
            readonly sm: {
                readonly value: {
                    readonly fontSize: "sm";
                    readonly lineHeight: "sm";
                    readonly color: "text.dimmed";
                };
            };
            readonly md: {
                readonly value: {
                    readonly fontSize: "md";
                    readonly lineHeight: "md";
                    readonly color: "text.dimmed";
                };
            };
        };
        readonly xxs: {
            readonly value: {
                readonly fontSize: "xxs";
                readonly lineHeight: "xxs";
            };
        };
        readonly xs: {
            readonly value: {
                readonly fontSize: "xs";
                readonly lineHeight: "xs";
            };
        };
        readonly sm: {
            readonly value: {
                readonly fontSize: "sm";
                readonly lineHeight: "sm";
            };
        };
        readonly md: {
            readonly value: {
                readonly fontSize: "md";
                readonly lineHeight: "md";
            };
        };
        readonly lg: {
            readonly value: {
                readonly fontSize: "lg";
                readonly lineHeight: "lg";
            };
        };
        readonly xl: {
            readonly value: {
                readonly fontSize: "xl";
                readonly lineHeight: "xl";
            };
        };
        readonly likec4: {
            readonly DEFAULT: {
                readonly description: "Text style for panel content";
                readonly value: {
                    readonly fontSize: "md";
                    readonly lineHeight: "md";
                    readonly fontWeight: "normal";
                    readonly color: "text";
                };
            };
            readonly panel: {
                readonly DEFAULT: {
                    readonly description: "Text style for panel content";
                    readonly value: {
                        readonly fontSize: "sm";
                        readonly lineHeight: "sm";
                        readonly fontWeight: "medium";
                        readonly color: "likec4.panel.text";
                    };
                };
                readonly action: {
                    readonly description: "Text style for panel action items";
                    readonly value: {
                        readonly fontSize: "sm";
                        readonly lineHeight: "sm";
                        readonly fontWeight: "medium";
                        readonly color: {
                            readonly base: "likec4.panel.action";
                            readonly _hover: "likec4.panel.action.hover";
                        };
                    };
                };
            };
        };
    };
    layerStyles: import("@pandacss/dev").LayerStyles;
    tokens: {
        fontSizes: {
            xxs: {
                value: string;
            };
            xs: {
                value: string;
            };
            sm: {
                value: string;
            };
            md: {
                value: string;
            };
            lg: {
                value: string;
            };
            xl: {
                value: string;
            };
            likec4: {
                xs: {
                    description: string;
                    value: string;
                };
                sm: {
                    description: string;
                    value: string;
                };
                md: {
                    description: string;
                    value: string;
                };
                lg: {
                    description: string;
                    value: string;
                };
                xl: {
                    description: string;
                    value: string;
                };
            };
        };
        lineHeights: {
            xxs: {
                value: string;
            };
            xs: {
                value: string;
            };
            sm: {
                value: string;
            };
            md: {
                value: string;
            };
            lg: {
                value: string;
            };
            xl: {
                value: string;
            };
            '1': {
                value: string;
            };
        };
        sizes: {
            '100%': {
                value: string;
            };
            full: {
                value: string;
            };
        };
        borders: {
            none: {
                value: string;
            };
            transparent: {
                value: string;
            };
            default: {
                value: string;
            };
        };
        borderWidths: {
            '0': {
                value: string;
            };
            '1': {
                value: string;
            };
            '2': {
                value: string;
            };
            '3': {
                value: string;
            };
            '4': {
                value: string;
            };
        };
        spacing: {
            '0': {
                description: string;
                value: string;
            };
            '0.5': {
                description: string;
                value: string;
            };
            '1': {
                description: string;
                value: string;
            };
            '1.5': {
                description: string;
                value: string;
            };
            '2': {
                description: string;
                value: string;
            };
            '2.5': {
                description: string;
                value: string;
            };
            '3': {
                description: string;
                value: string;
            };
            '3.5': {
                description: string;
                value: string;
            };
            '4': {
                description: string;
                value: string;
            };
            '4.5': {
                description: string;
                value: string;
            };
            '5': {
                description: string;
                value: string;
            };
            '6': {
                description: string;
                value: string;
            };
            '7': {
                description: string;
                value: string;
            };
            '8': {
                description: string;
                value: string;
            };
            '9': {
                description: string;
                value: string;
            };
            '10': {
                description: string;
                value: string;
            };
            '12': {
                description: string;
                value: string;
            };
            '16': {
                description: string;
                value: string;
            };
            xxs: {
                description: string;
                value: string;
            };
            xs: {
                description: string;
                value: string;
            };
            sm: {
                description: string;
                value: string;
            };
            md: {
                description: string;
                value: string;
            };
            lg: {
                description: string;
                value: string;
            };
            xl: {
                description: string;
                value: string;
            };
            likec4: {
                xs: {
                    description: string;
                    value: string;
                };
                sm: {
                    description: string;
                    value: string;
                };
                md: {
                    description: string;
                    value: string;
                };
                lg: {
                    description: string;
                    value: string;
                };
                xl: {
                    description: string;
                    value: string;
                };
            };
        };
        radii: {
            '0': {
                value: string;
            };
            xs: {
                value: string;
            };
            sm: {
                value: string;
            };
            md: {
                value: string;
            };
            lg: {
                value: string;
            };
            xl: {
                value: string;
            };
        };
        colors: {
            mantine: {
                colors: {
                    primary: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'primary[0]': {
                        description: string;
                        value: string;
                    };
                    'primary[1]': {
                        description: string;
                        value: string;
                    };
                    'primary[2]': {
                        description: string;
                        value: string;
                    };
                    'primary[3]': {
                        description: string;
                        value: string;
                    };
                    'primary[4]': {
                        description: string;
                        value: string;
                    };
                    'primary[5]': {
                        description: string;
                        value: string;
                    };
                    'primary[6]': {
                        description: string;
                        value: string;
                    };
                    'primary[7]': {
                        description: string;
                        value: string;
                    };
                    'primary[8]': {
                        description: string;
                        value: string;
                    };
                    'primary[9]': {
                        description: string;
                        value: string;
                    };
                    white: {
                        value: string;
                    };
                    text: {
                        value: string;
                    };
                    body: {
                        value: string;
                    };
                    dimmed: {
                        value: string;
                    };
                    defaultBorder: {
                        value: string;
                    };
                    defaultColor: {
                        value: string;
                    };
                    defaultHover: {
                        value: string;
                    };
                    default: {
                        value: string;
                    };
                    error: {
                        value: string;
                    };
                    placeholder: {
                        value: string;
                    };
                    gray: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'gray[0]': {
                        description: string;
                        value: string;
                    };
                    'gray[1]': {
                        description: string;
                        value: string;
                    };
                    'gray[2]': {
                        description: string;
                        value: string;
                    };
                    'gray[3]': {
                        description: string;
                        value: string;
                    };
                    'gray[4]': {
                        description: string;
                        value: string;
                    };
                    'gray[5]': {
                        description: string;
                        value: string;
                    };
                    'gray[6]': {
                        description: string;
                        value: string;
                    };
                    'gray[7]': {
                        description: string;
                        value: string;
                    };
                    'gray[8]': {
                        description: string;
                        value: string;
                    };
                    'gray[9]': {
                        description: string;
                        value: string;
                    };
                    dark: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'dark[0]': {
                        description: string;
                        value: string;
                    };
                    'dark[1]': {
                        description: string;
                        value: string;
                    };
                    'dark[2]': {
                        description: string;
                        value: string;
                    };
                    'dark[3]': {
                        description: string;
                        value: string;
                    };
                    'dark[4]': {
                        description: string;
                        value: string;
                    };
                    'dark[5]': {
                        description: string;
                        value: string;
                    };
                    'dark[6]': {
                        description: string;
                        value: string;
                    };
                    'dark[7]': {
                        description: string;
                        value: string;
                    };
                    'dark[8]': {
                        description: string;
                        value: string;
                    };
                    'dark[9]': {
                        description: string;
                        value: string;
                    };
                    orange: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'orange[0]': {
                        description: string;
                        value: string;
                    };
                    'orange[1]': {
                        description: string;
                        value: string;
                    };
                    'orange[2]': {
                        description: string;
                        value: string;
                    };
                    'orange[3]': {
                        description: string;
                        value: string;
                    };
                    'orange[4]': {
                        description: string;
                        value: string;
                    };
                    'orange[5]': {
                        description: string;
                        value: string;
                    };
                    'orange[6]': {
                        description: string;
                        value: string;
                    };
                    'orange[7]': {
                        description: string;
                        value: string;
                    };
                    'orange[8]': {
                        description: string;
                        value: string;
                    };
                    'orange[9]': {
                        description: string;
                        value: string;
                    };
                    teal: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'teal[0]': {
                        description: string;
                        value: string;
                    };
                    'teal[1]': {
                        description: string;
                        value: string;
                    };
                    'teal[2]': {
                        description: string;
                        value: string;
                    };
                    'teal[3]': {
                        description: string;
                        value: string;
                    };
                    'teal[4]': {
                        description: string;
                        value: string;
                    };
                    'teal[5]': {
                        description: string;
                        value: string;
                    };
                    'teal[6]': {
                        description: string;
                        value: string;
                    };
                    'teal[7]': {
                        description: string;
                        value: string;
                    };
                    'teal[8]': {
                        description: string;
                        value: string;
                    };
                    'teal[9]': {
                        description: string;
                        value: string;
                    };
                    red: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'red[0]': {
                        description: string;
                        value: string;
                    };
                    'red[1]': {
                        description: string;
                        value: string;
                    };
                    'red[2]': {
                        description: string;
                        value: string;
                    };
                    'red[3]': {
                        description: string;
                        value: string;
                    };
                    'red[4]': {
                        description: string;
                        value: string;
                    };
                    'red[5]': {
                        description: string;
                        value: string;
                    };
                    'red[6]': {
                        description: string;
                        value: string;
                    };
                    'red[7]': {
                        description: string;
                        value: string;
                    };
                    'red[8]': {
                        description: string;
                        value: string;
                    };
                    'red[9]': {
                        description: string;
                        value: string;
                    };
                    green: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'green[0]': {
                        description: string;
                        value: string;
                    };
                    'green[1]': {
                        description: string;
                        value: string;
                    };
                    'green[2]': {
                        description: string;
                        value: string;
                    };
                    'green[3]': {
                        description: string;
                        value: string;
                    };
                    'green[4]': {
                        description: string;
                        value: string;
                    };
                    'green[5]': {
                        description: string;
                        value: string;
                    };
                    'green[6]': {
                        description: string;
                        value: string;
                    };
                    'green[7]': {
                        description: string;
                        value: string;
                    };
                    'green[8]': {
                        description: string;
                        value: string;
                    };
                    'green[9]': {
                        description: string;
                        value: string;
                    };
                    yellow: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        filled: {
                            description: string;
                            value: string;
                        };
                        filledHover: {
                            description: string;
                            value: string;
                        };
                        light: {
                            description: string;
                            value: string;
                        };
                        lightHover: {
                            description: string;
                            value: string;
                        };
                        lightColor: {
                            description: string;
                            value: string;
                        };
                        outline: {
                            description: string;
                            value: string;
                        };
                        outlineHover: {
                            description: string;
                            value: string;
                        };
                    };
                    'yellow[0]': {
                        description: string;
                        value: string;
                    };
                    'yellow[1]': {
                        description: string;
                        value: string;
                    };
                    'yellow[2]': {
                        description: string;
                        value: string;
                    };
                    'yellow[3]': {
                        description: string;
                        value: string;
                    };
                    'yellow[4]': {
                        description: string;
                        value: string;
                    };
                    'yellow[5]': {
                        description: string;
                        value: string;
                    };
                    'yellow[6]': {
                        description: string;
                        value: string;
                    };
                    'yellow[7]': {
                        description: string;
                        value: string;
                    };
                    'yellow[8]': {
                        description: string;
                        value: string;
                    };
                    'yellow[9]': {
                        description: string;
                        value: string;
                    };
                };
            };
            transparent: {
                value: string;
            };
            none: {
                value: string;
            };
            inherit: {
                value: string;
            };
        };
        fontWeights: {
            normal: {
                value: string;
            };
            medium: {
                value: string;
            };
            bold: {
                value: string;
            };
            bolder: {
                value: string;
            };
        };
        fonts: {
            mono: {
                value: string;
            };
            body: {
                value: string;
            };
            likec4: {
                DEFAULT: {
                    value: string;
                };
                element: {
                    value: string;
                };
                compound: {
                    value: string;
                };
                relation: {
                    value: string;
                };
            };
        };
        easings: {
            default: {
                value: string;
            };
            in: {
                value: string;
            };
            out: {
                value: string;
            };
            inOut: {
                value: string;
            };
        };
        durations: {
            fastest: {
                value: string;
            };
            faster: {
                value: string;
            };
            fast: {
                value: string;
            };
            normal: {
                value: string;
            };
            slow: {
                value: string;
            };
            slower: {
                value: string;
            };
            slowest: {
                value: string;
            };
        };
        shadows: {
            none: {
                value: string;
            };
            xs: {
                value: string;
            };
            sm: {
                value: string;
            };
            md: {
                value: string;
            };
            lg: {
                value: string;
            };
            xl: {
                value: string;
            };
        };
        zIndex: {
            '-1': {
                value: string;
            };
            '0': {
                value: string;
            };
            '1': {
                value: string;
            };
            likec4: {
                diagram: {
                    edge: {
                        DEFAULT: {
                            value: string;
                        };
                        label: {
                            value: string;
                        };
                        controlPoint: {
                            value: string;
                        };
                    };
                    node: {
                        compound: {
                            value: string;
                        };
                        element: {
                            value: string;
                        };
                    };
                };
                dropdown: {
                    value: string;
                };
                panel: {
                    DEFAULT: {
                        value: string;
                    };
                    dropdown: {
                        value: string;
                    };
                };
            };
        };
    };
    semanticTokens: {
        colors: {
            white: {
                value: string;
            };
            black: {
                value: string;
            };
            body: {
                description: string;
                value: "var(--mantine-color-body)";
            };
            text: {
                DEFAULT: {
                    description: string;
                    value: "var(--mantine-color-text)";
                };
                bright: {
                    description: string;
                    value: string;
                };
                dimmed: {
                    description: string;
                    value: string;
                };
                placeholder: {
                    description: string;
                    value: "var(--mantine-color-placeholder)";
                };
            };
            default: {
                DEFAULT: {
                    description: string;
                    value: "var(--mantine-color-default)";
                };
                color: {
                    description: string;
                    value: "var(--mantine-color-default-color)";
                };
                border: {
                    description: string;
                    value: "var(--mantine-color-default-border)";
                };
                hover: {
                    description: string;
                    value: "var(--mantine-color-default-hover)";
                };
            };
            disabled: {
                text: {
                    description: string;
                    value: "var(--mantine-color-disabled-color)";
                };
                border: {
                    description: string;
                    value: "var(--mantine-color-disabled-border)";
                };
                body: {
                    description: string;
                    value: "var(--mantine-color-disabled)";
                };
            };
            likec4: {
                background: {
                    DEFAULT: {
                        description: string;
                        value: "var(--mantine-color-body)";
                    };
                    pattern: {
                        description: string;
                        value: {
                            base: "var(--mantine-color-gray-4)";
                            _dark: string;
                        };
                    };
                };
                mixColor: {
                    description: string;
                    value: {
                        base: string;
                        _dark: string;
                    };
                };
                tag: {
                    bg: {
                        DEFAULT: {
                            value: string;
                        };
                        hover: {
                            value: string;
                        };
                    };
                    border: {
                        value: string;
                    };
                    text: {
                        value: string;
                    };
                };
                panel: {
                    bg: {
                        DEFAULT: {
                            description: string;
                            value: {
                                base: "var(--mantine-color-body)";
                                _dark: "var(--mantine-color-dark-6)";
                            };
                        };
                    };
                    border: {
                        description: string;
                        value: {
                            base: string;
                            _light: "var(--mantine-color-gray-2)";
                        };
                    };
                    text: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        dimmed: {
                            description: string;
                            value: string;
                        };
                    };
                    action: {
                        DEFAULT: {
                            description: string;
                            value: string;
                        };
                        disabled: {
                            description: string;
                            value: string;
                        };
                        hover: {
                            description: string;
                            value: string;
                        };
                        bg: {
                            DEFAULT: {
                                description: string;
                                value: {
                                    base: "var(--mantine-color-gray-1)";
                                    _dark: string;
                                };
                            };
                            hover: {
                                description: string;
                                value: {
                                    base: "var(--mantine-color-gray-2)";
                                    _dark: "var(--mantine-color-dark-8)";
                                };
                            };
                        };
                        warning: {
                            DEFAULT: {
                                description: string;
                                value: "var(--mantine-color-orange-6)";
                            };
                            hover: {
                                description: string;
                                value: {
                                    base: "var(--mantine-color-orange-7)";
                                    _dark: "var(--mantine-color-orange-5)";
                                };
                            };
                            bg: {
                                DEFAULT: {
                                    description: string;
                                    value: {
                                        base: string;
                                        _dark: string;
                                    };
                                };
                                hover: {
                                    description: string;
                                    value: {
                                        base: string;
                                        _dark: string;
                                    };
                                };
                            };
                        };
                    };
                };
                dropdown: {
                    bg: {
                        DEFAULT: {
                            description: string;
                            value: {
                                base: string;
                                _dark: "var(--mantine-color-dark-6)";
                            };
                        };
                    };
                    border: {
                        description: string;
                        value: string;
                    };
                };
                overlay: {
                    backdrop: {
                        DEFAULT: {
                            description: string;
                            value: {
                                base: string;
                                _dark: string;
                            };
                        };
                    };
                    body: {
                        DEFAULT: {
                            description: string;
                            value: {
                                base: "var(--mantine-color-body)";
                                _dark: "var(--mantine-color-dark-6)";
                            };
                        };
                    };
                    border: {
                        description: string;
                        value: string;
                    };
                };
                walkthrough: {
                    parallelFrame: {
                        description: string;
                        value: {
                            _light: "var(--mantine-color-orange-8)";
                            _dark: "var(--mantine-color-orange-6)";
                        };
                    };
                };
                compare: {
                    manual: {
                        DEFAULT: {
                            description: string;
                            value: {
                                _light: "var(--mantine-color-orange-8)";
                                _dark: "var(--mantine-color-orange-6)";
                            };
                        };
                        outline: {
                            description: string;
                            value: {
                                _light: "var(--mantine-color-orange-8)";
                                _dark: string;
                            };
                        };
                    };
                    latest: {
                        description: string;
                        value: "var(--mantine-color-green-6)";
                    };
                };
            };
        };
    };
    recipes: typeof recipes;
    slotRecipes: typeof slotRecipes;
    containerNames: string[];
    containerSizes: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
    };
    keyframes: import("@pandacss/dev").CssKeyframes;
    animationStyles: import("@pandacss/types").AnimationStyles;
};
declare const _default: import("@pandacss/dev").Preset;
export default _default;
export declare const vars: {
    likec4: {
        readonly font: "--likec4-app-font";
        readonly spacing: "--likec4-spacing";
        readonly textsize: "--likec4-text-size";
        readonly palette: {
            readonly fill: "--likec4-palette-fill";
            readonly stroke: "--likec4-palette-stroke";
            readonly hiContrast: "--likec4-palette-hiContrast";
            readonly loContrast: "--likec4-palette-loContrast";
            readonly relationStroke: "--likec4-palette-relation-stroke";
            readonly relationStrokeSelected: "--likec4-palette-relation-stroke-selected";
            readonly relationLabel: "--likec4-palette-relation-label";
            readonly relationLabelBg: "--likec4-palette-relation-label-bg";
            readonly outline: "--likec4-palette-outline";
        };
        readonly icon: {
            readonly size: "--likec4-icon-size";
            readonly color: "--likec4-icon-color";
        };
    };
    mantine: {
        readonly scale: "var(--mantine-scale)";
        readonly cursorType: "var(--mantine-cursor-type)";
        readonly webkitFontSmoothing: "var(--mantine-webkit-font-smoothing)";
        readonly mozFontSmoothing: "var(--mantine-moz-font-smoothing)";
        readonly lineHeight: "var(--mantine-line-height)";
        readonly fontFamily: "var(--mantine-font-family)";
        readonly fontFamilyMonospace: "var(--mantine-font-family-monospace)";
        readonly fontFamilyHeadings: "var(--mantine-font-family-headings)";
        readonly headingFontWeight: "var(--mantine-heading-font-weight)";
        readonly radiusDefault: "var(--mantine-radius-default)";
        readonly breakpoints: {
            readonly xs: "36em";
            readonly sm: "48em";
            readonly md: "62em";
            readonly lg: "75em";
            readonly xl: "88em";
        };
        readonly fontSizes: {
            readonly xs: "var(--mantine-font-size-xs)";
            readonly sm: "var(--mantine-font-size-sm)";
            readonly md: "var(--mantine-font-size-md)";
            readonly lg: "var(--mantine-font-size-lg)";
            readonly xl: "var(--mantine-font-size-xl)";
        };
        readonly lineHeights: {
            readonly xs: "var(--mantine-line-height-xs)";
            readonly sm: "var(--mantine-line-height-sm)";
            readonly md: "var(--mantine-line-height-md)";
            readonly lg: "var(--mantine-line-height-lg)";
            readonly xl: "var(--mantine-line-height-xl)";
        };
        readonly shadows: {
            readonly xs: "var(--mantine-shadow-xs)";
            readonly sm: "var(--mantine-shadow-sm)";
            readonly md: "var(--mantine-shadow-md)";
            readonly lg: "var(--mantine-shadow-lg)";
            readonly xl: "var(--mantine-shadow-xl)";
        };
        readonly radius: {
            readonly xs: "var(--mantine-radius-xs)";
            readonly sm: "var(--mantine-radius-sm)";
            readonly md: "var(--mantine-radius-md)";
            readonly lg: "var(--mantine-radius-lg)";
            readonly xl: "var(--mantine-radius-xl)";
        };
        readonly headings: {
            readonly h1: {
                readonly fontSize: "var(--mantine-h1-font-size)";
                readonly lineHeight: "var(--mantine-h1-line-height)";
                readonly fontWeight: "var(--mantine-h1-font-weight)";
            };
            readonly h2: {
                readonly fontSize: "var(--mantine-h2-font-size)";
                readonly lineHeight: "var(--mantine-h2-line-height)";
                readonly fontWeight: "var(--mantine-h2-font-weight)";
            };
            readonly h3: {
                readonly fontSize: "var(--mantine-h3-font-size)";
                readonly lineHeight: "var(--mantine-h3-line-height)";
                readonly fontWeight: "var(--mantine-h3-font-weight)";
            };
            readonly h4: {
                readonly fontSize: "var(--mantine-h4-font-size)";
                readonly lineHeight: "var(--mantine-h4-line-height)";
                readonly fontWeight: "var(--mantine-h4-font-weight)";
            };
            readonly h5: {
                readonly fontSize: "var(--mantine-h5-font-size)";
                readonly lineHeight: "var(--mantine-h5-line-height)";
                readonly fontWeight: "var(--mantine-h5-font-weight)";
            };
            readonly h6: {
                readonly fontSize: "var(--mantine-h6-font-size)";
                readonly lineHeight: "var(--mantine-h6-line-height)";
                readonly fontWeight: "var(--mantine-h6-font-weight)";
            };
        };
        readonly spacing: {
            readonly xs: "var(--mantine-spacing-xs)";
            readonly sm: "var(--mantine-spacing-sm)";
            readonly md: "var(--mantine-spacing-md)";
            readonly lg: "var(--mantine-spacing-lg)";
            readonly xl: "var(--mantine-spacing-xl)";
        };
        readonly colors: {
            readonly primary: "var(--mantine-primary-color-filled)";
            readonly primaryColors: {
                readonly '0': "var(--mantine-primary-color-0)";
                readonly '1': "var(--mantine-primary-color-1)";
                readonly '2': "var(--mantine-primary-color-2)";
                readonly '3': "var(--mantine-primary-color-3)";
                readonly '4': "var(--mantine-primary-color-4)";
                readonly '5': "var(--mantine-primary-color-5)";
                readonly '6': "var(--mantine-primary-color-6)";
                readonly '7': "var(--mantine-primary-color-7)";
                readonly '8': "var(--mantine-primary-color-8)";
                readonly '9': "var(--mantine-primary-color-9)";
                readonly filled: "var(--mantine-primary-color-filled)";
                readonly filledHover: "var(--mantine-primary-color-filled-hover)";
                readonly light: "var(--mantine-primary-color-light)";
                readonly lightHover: "var(--mantine-primary-color-light-hover)";
                readonly lightColor: "var(--mantine-primary-color-light-color)";
                readonly outline: "var(--mantine-primary-color-outline)";
                readonly outlineHover: "var(--mantine-primary-color-outline-hover)";
            };
            readonly white: "var(--mantine-color-white)";
            readonly black: "var(--mantine-color-black)";
            readonly text: "var(--mantine-color-text)";
            readonly body: "var(--mantine-color-body)";
            readonly error: "var(--mantine-color-error)";
            readonly placeholder: "var(--mantine-color-placeholder)";
            readonly anchor: "var(--mantine-color-anchor)";
            readonly default: "var(--mantine-color-default)";
            readonly defaultHover: "var(--mantine-color-default-hover)";
            readonly defaultColor: "var(--mantine-color-default-color)";
            readonly defaultBorder: "var(--mantine-color-default-border)";
            readonly dimmed: "var(--mantine-color-dimmed)";
            readonly disabledBody: "var(--mantine-color-disabled)";
            readonly disabledText: "var(--mantine-color-disabled-color)";
            readonly disabledBorder: "var(--mantine-color-disabled-border)";
            readonly dark: {
                readonly '0': "var(--mantine-color-dark-0)";
                readonly '1': "var(--mantine-color-dark-1)";
                readonly '2': "var(--mantine-color-dark-2)";
                readonly '3': "var(--mantine-color-dark-3)";
                readonly '4': "var(--mantine-color-dark-4)";
                readonly '5': "var(--mantine-color-dark-5)";
                readonly '6': "var(--mantine-color-dark-6)";
                readonly '7': "var(--mantine-color-dark-7)";
                readonly '8': "var(--mantine-color-dark-8)";
                readonly '9': "var(--mantine-color-dark-9)";
                readonly filled: "var(--mantine-color-dark-filled)";
                readonly filledHover: "var(--mantine-color-dark-filled-hover)";
                readonly light: "var(--mantine-color-dark-light)";
                readonly lightHover: "var(--mantine-color-dark-light-hover)";
                readonly lightColor: "var(--mantine-color-dark-light-color)";
                readonly outline: "var(--mantine-color-dark-outline)";
                readonly outlineHover: "var(--mantine-color-dark-outline-hover)";
            };
            readonly gray: {
                readonly '0': "var(--mantine-color-gray-0)";
                readonly '1': "var(--mantine-color-gray-1)";
                readonly '2': "var(--mantine-color-gray-2)";
                readonly '3': "var(--mantine-color-gray-3)";
                readonly '4': "var(--mantine-color-gray-4)";
                readonly '5': "var(--mantine-color-gray-5)";
                readonly '6': "var(--mantine-color-gray-6)";
                readonly '7': "var(--mantine-color-gray-7)";
                readonly '8': "var(--mantine-color-gray-8)";
                readonly '9': "var(--mantine-color-gray-9)";
                readonly filled: "var(--mantine-color-gray-filled)";
                readonly filledHover: "var(--mantine-color-gray-filled-hover)";
                readonly light: "var(--mantine-color-gray-light)";
                readonly lightHover: "var(--mantine-color-gray-light-hover)";
                readonly lightColor: "var(--mantine-color-gray-light-color)";
                readonly outline: "var(--mantine-color-gray-outline)";
                readonly outlineHover: "var(--mantine-color-gray-outline-hover)";
            };
            readonly red: {
                readonly '0': "var(--mantine-color-red-0)";
                readonly '1': "var(--mantine-color-red-1)";
                readonly '2': "var(--mantine-color-red-2)";
                readonly '3': "var(--mantine-color-red-3)";
                readonly '4': "var(--mantine-color-red-4)";
                readonly '5': "var(--mantine-color-red-5)";
                readonly '6': "var(--mantine-color-red-6)";
                readonly '7': "var(--mantine-color-red-7)";
                readonly '8': "var(--mantine-color-red-8)";
                readonly '9': "var(--mantine-color-red-9)";
                readonly filled: "var(--mantine-color-red-filled)";
                readonly filledHover: "var(--mantine-color-red-filled-hover)";
                readonly light: "var(--mantine-color-red-light)";
                readonly lightHover: "var(--mantine-color-red-light-hover)";
                readonly lightColor: "var(--mantine-color-red-light-color)";
                readonly outline: "var(--mantine-color-red-outline)";
                readonly outlineHover: "var(--mantine-color-red-outline-hover)";
            };
            readonly pink: {
                readonly '0': "var(--mantine-color-pink-0)";
                readonly '1': "var(--mantine-color-pink-1)";
                readonly '2': "var(--mantine-color-pink-2)";
                readonly '3': "var(--mantine-color-pink-3)";
                readonly '4': "var(--mantine-color-pink-4)";
                readonly '5': "var(--mantine-color-pink-5)";
                readonly '6': "var(--mantine-color-pink-6)";
                readonly '7': "var(--mantine-color-pink-7)";
                readonly '8': "var(--mantine-color-pink-8)";
                readonly '9': "var(--mantine-color-pink-9)";
                readonly filled: "var(--mantine-color-pink-filled)";
                readonly filledHover: "var(--mantine-color-pink-filled-hover)";
                readonly light: "var(--mantine-color-pink-light)";
                readonly lightHover: "var(--mantine-color-pink-light-hover)";
                readonly lightColor: "var(--mantine-color-pink-light-color)";
                readonly outline: "var(--mantine-color-pink-outline)";
                readonly outlineHover: "var(--mantine-color-pink-outline-hover)";
            };
            readonly grape: {
                readonly '0': "var(--mantine-color-grape-0)";
                readonly '1': "var(--mantine-color-grape-1)";
                readonly '2': "var(--mantine-color-grape-2)";
                readonly '3': "var(--mantine-color-grape-3)";
                readonly '4': "var(--mantine-color-grape-4)";
                readonly '5': "var(--mantine-color-grape-5)";
                readonly '6': "var(--mantine-color-grape-6)";
                readonly '7': "var(--mantine-color-grape-7)";
                readonly '8': "var(--mantine-color-grape-8)";
                readonly '9': "var(--mantine-color-grape-9)";
                readonly filled: "var(--mantine-color-grape-filled)";
                readonly filledHover: "var(--mantine-color-grape-filled-hover)";
                readonly light: "var(--mantine-color-grape-light)";
                readonly lightHover: "var(--mantine-color-grape-light-hover)";
                readonly lightColor: "var(--mantine-color-grape-light-color)";
                readonly outline: "var(--mantine-color-grape-outline)";
                readonly outlineHover: "var(--mantine-color-grape-outline-hover)";
            };
            readonly violet: {
                readonly '0': "var(--mantine-color-violet-0)";
                readonly '1': "var(--mantine-color-violet-1)";
                readonly '2': "var(--mantine-color-violet-2)";
                readonly '3': "var(--mantine-color-violet-3)";
                readonly '4': "var(--mantine-color-violet-4)";
                readonly '5': "var(--mantine-color-violet-5)";
                readonly '6': "var(--mantine-color-violet-6)";
                readonly '7': "var(--mantine-color-violet-7)";
                readonly '8': "var(--mantine-color-violet-8)";
                readonly '9': "var(--mantine-color-violet-9)";
                readonly filled: "var(--mantine-color-violet-filled)";
                readonly filledHover: "var(--mantine-color-violet-filled-hover)";
                readonly light: "var(--mantine-color-violet-light)";
                readonly lightHover: "var(--mantine-color-violet-light-hover)";
                readonly lightColor: "var(--mantine-color-violet-light-color)";
                readonly outline: "var(--mantine-color-violet-outline)";
                readonly outlineHover: "var(--mantine-color-violet-outline-hover)";
            };
            readonly indigo: {
                readonly '0': "var(--mantine-color-indigo-0)";
                readonly '1': "var(--mantine-color-indigo-1)";
                readonly '2': "var(--mantine-color-indigo-2)";
                readonly '3': "var(--mantine-color-indigo-3)";
                readonly '4': "var(--mantine-color-indigo-4)";
                readonly '5': "var(--mantine-color-indigo-5)";
                readonly '6': "var(--mantine-color-indigo-6)";
                readonly '7': "var(--mantine-color-indigo-7)";
                readonly '8': "var(--mantine-color-indigo-8)";
                readonly '9': "var(--mantine-color-indigo-9)";
                readonly filled: "var(--mantine-color-indigo-filled)";
                readonly filledHover: "var(--mantine-color-indigo-filled-hover)";
                readonly light: "var(--mantine-color-indigo-light)";
                readonly lightHover: "var(--mantine-color-indigo-light-hover)";
                readonly lightColor: "var(--mantine-color-indigo-light-color)";
                readonly outline: "var(--mantine-color-indigo-outline)";
                readonly outlineHover: "var(--mantine-color-indigo-outline-hover)";
            };
            readonly blue: {
                readonly '0': "var(--mantine-color-blue-0)";
                readonly '1': "var(--mantine-color-blue-1)";
                readonly '2': "var(--mantine-color-blue-2)";
                readonly '3': "var(--mantine-color-blue-3)";
                readonly '4': "var(--mantine-color-blue-4)";
                readonly '5': "var(--mantine-color-blue-5)";
                readonly '6': "var(--mantine-color-blue-6)";
                readonly '7': "var(--mantine-color-blue-7)";
                readonly '8': "var(--mantine-color-blue-8)";
                readonly '9': "var(--mantine-color-blue-9)";
                readonly filled: "var(--mantine-color-blue-filled)";
                readonly filledHover: "var(--mantine-color-blue-filled-hover)";
                readonly light: "var(--mantine-color-blue-light)";
                readonly lightHover: "var(--mantine-color-blue-light-hover)";
                readonly lightColor: "var(--mantine-color-blue-light-color)";
                readonly outline: "var(--mantine-color-blue-outline)";
                readonly outlineHover: "var(--mantine-color-blue-outline-hover)";
            };
            readonly cyan: {
                readonly '0': "var(--mantine-color-cyan-0)";
                readonly '1': "var(--mantine-color-cyan-1)";
                readonly '2': "var(--mantine-color-cyan-2)";
                readonly '3': "var(--mantine-color-cyan-3)";
                readonly '4': "var(--mantine-color-cyan-4)";
                readonly '5': "var(--mantine-color-cyan-5)";
                readonly '6': "var(--mantine-color-cyan-6)";
                readonly '7': "var(--mantine-color-cyan-7)";
                readonly '8': "var(--mantine-color-cyan-8)";
                readonly '9': "var(--mantine-color-cyan-9)";
                readonly filled: "var(--mantine-color-cyan-filled)";
                readonly filledHover: "var(--mantine-color-cyan-filled-hover)";
                readonly light: "var(--mantine-color-cyan-light)";
                readonly lightHover: "var(--mantine-color-cyan-light-hover)";
                readonly lightColor: "var(--mantine-color-cyan-light-color)";
                readonly outline: "var(--mantine-color-cyan-outline)";
                readonly outlineHover: "var(--mantine-color-cyan-outline-hover)";
            };
            readonly teal: {
                readonly '0': "var(--mantine-color-teal-0)";
                readonly '1': "var(--mantine-color-teal-1)";
                readonly '2': "var(--mantine-color-teal-2)";
                readonly '3': "var(--mantine-color-teal-3)";
                readonly '4': "var(--mantine-color-teal-4)";
                readonly '5': "var(--mantine-color-teal-5)";
                readonly '6': "var(--mantine-color-teal-6)";
                readonly '7': "var(--mantine-color-teal-7)";
                readonly '8': "var(--mantine-color-teal-8)";
                readonly '9': "var(--mantine-color-teal-9)";
                readonly filled: "var(--mantine-color-teal-filled)";
                readonly filledHover: "var(--mantine-color-teal-filled-hover)";
                readonly light: "var(--mantine-color-teal-light)";
                readonly lightHover: "var(--mantine-color-teal-light-hover)";
                readonly lightColor: "var(--mantine-color-teal-light-color)";
                readonly outline: "var(--mantine-color-teal-outline)";
                readonly outlineHover: "var(--mantine-color-teal-outline-hover)";
            };
            readonly green: {
                readonly '0': "var(--mantine-color-green-0)";
                readonly '1': "var(--mantine-color-green-1)";
                readonly '2': "var(--mantine-color-green-2)";
                readonly '3': "var(--mantine-color-green-3)";
                readonly '4': "var(--mantine-color-green-4)";
                readonly '5': "var(--mantine-color-green-5)";
                readonly '6': "var(--mantine-color-green-6)";
                readonly '7': "var(--mantine-color-green-7)";
                readonly '8': "var(--mantine-color-green-8)";
                readonly '9': "var(--mantine-color-green-9)";
                readonly filled: "var(--mantine-color-green-filled)";
                readonly filledHover: "var(--mantine-color-green-filled-hover)";
                readonly light: "var(--mantine-color-green-light)";
                readonly lightHover: "var(--mantine-color-green-light-hover)";
                readonly lightColor: "var(--mantine-color-green-light-color)";
                readonly outline: "var(--mantine-color-green-outline)";
                readonly outlineHover: "var(--mantine-color-green-outline-hover)";
            };
            readonly lime: {
                readonly '0': "var(--mantine-color-lime-0)";
                readonly '1': "var(--mantine-color-lime-1)";
                readonly '2': "var(--mantine-color-lime-2)";
                readonly '3': "var(--mantine-color-lime-3)";
                readonly '4': "var(--mantine-color-lime-4)";
                readonly '5': "var(--mantine-color-lime-5)";
                readonly '6': "var(--mantine-color-lime-6)";
                readonly '7': "var(--mantine-color-lime-7)";
                readonly '8': "var(--mantine-color-lime-8)";
                readonly '9': "var(--mantine-color-lime-9)";
                readonly filled: "var(--mantine-color-lime-filled)";
                readonly filledHover: "var(--mantine-color-lime-filled-hover)";
                readonly light: "var(--mantine-color-lime-light)";
                readonly lightHover: "var(--mantine-color-lime-light-hover)";
                readonly lightColor: "var(--mantine-color-lime-light-color)";
                readonly outline: "var(--mantine-color-lime-outline)";
                readonly outlineHover: "var(--mantine-color-lime-outline-hover)";
            };
            readonly yellow: {
                readonly '0': "var(--mantine-color-yellow-0)";
                readonly '1': "var(--mantine-color-yellow-1)";
                readonly '2': "var(--mantine-color-yellow-2)";
                readonly '3': "var(--mantine-color-yellow-3)";
                readonly '4': "var(--mantine-color-yellow-4)";
                readonly '5': "var(--mantine-color-yellow-5)";
                readonly '6': "var(--mantine-color-yellow-6)";
                readonly '7': "var(--mantine-color-yellow-7)";
                readonly '8': "var(--mantine-color-yellow-8)";
                readonly '9': "var(--mantine-color-yellow-9)";
                readonly filled: "var(--mantine-color-yellow-filled)";
                readonly filledHover: "var(--mantine-color-yellow-filled-hover)";
                readonly light: "var(--mantine-color-yellow-light)";
                readonly lightHover: "var(--mantine-color-yellow-light-hover)";
                readonly lightColor: "var(--mantine-color-yellow-light-color)";
                readonly outline: "var(--mantine-color-yellow-outline)";
                readonly outlineHover: "var(--mantine-color-yellow-outline-hover)";
            };
            readonly orange: {
                readonly '0': "var(--mantine-color-orange-0)";
                readonly '1': "var(--mantine-color-orange-1)";
                readonly '2': "var(--mantine-color-orange-2)";
                readonly '3': "var(--mantine-color-orange-3)";
                readonly '4': "var(--mantine-color-orange-4)";
                readonly '5': "var(--mantine-color-orange-5)";
                readonly '6': "var(--mantine-color-orange-6)";
                readonly '7': "var(--mantine-color-orange-7)";
                readonly '8': "var(--mantine-color-orange-8)";
                readonly '9': "var(--mantine-color-orange-9)";
                readonly filled: "var(--mantine-color-orange-filled)";
                readonly filledHover: "var(--mantine-color-orange-filled-hover)";
                readonly light: "var(--mantine-color-orange-light)";
                readonly lightHover: "var(--mantine-color-orange-light-hover)";
                readonly lightColor: "var(--mantine-color-orange-light-color)";
                readonly outline: "var(--mantine-color-orange-outline)";
                readonly outlineHover: "var(--mantine-color-orange-outline-hover)";
            };
        };
        readonly rtlSelector: "[dir=\"rtl\"] &";
        readonly darkSelector: "[data-mantine-color-scheme=\"dark\"] &";
        readonly lightSelector: "[data-mantine-color-scheme=\"light\"] &";
    };
};
