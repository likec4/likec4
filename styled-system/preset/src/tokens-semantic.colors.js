"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = void 0;
var dev_1 = require("@pandacss/dev");
var generated_ts_1 = require("./generated.ts");
var helpers_ts_1 = require("./helpers.ts");
exports.colors = dev_1.defineSemanticTokens.colors({
    white: {
        value: '#fff',
    },
    black: {
        value: '#000',
    },
    body: {
        description: 'Background color',
        value: generated_ts_1.mantine.colors.body,
    },
    text: {
        DEFAULT: {
            description: 'Default text color',
            value: generated_ts_1.mantine.colors.text,
        },
        bright: {
            description: 'Bright text color',
            value: 'var(--mantine-color-bright)',
        },
        dimmed: {
            description: 'Dimmed text color',
            value: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.text, 60),
            // _dark: mantine.colors.dimmed,
        },
        placeholder: {
            description: 'Placeholder text color',
            value: generated_ts_1.mantine.colors.placeholder,
        },
    },
    default: {
        DEFAULT: {
            description: 'Default color',
            value: generated_ts_1.mantine.colors.default,
        },
        color: {
            description: 'Default text color',
            value: generated_ts_1.mantine.colors.defaultColor,
        },
        border: {
            description: 'Default border color',
            value: generated_ts_1.mantine.colors.defaultBorder,
        },
        hover: {
            description: 'Default hover color',
            value: generated_ts_1.mantine.colors.defaultHover,
        },
    },
    disabled: {
        text: {
            description: 'Disabled text color',
            value: generated_ts_1.mantine.colors.disabledText,
        },
        border: {
            description: 'Disabled border color',
            value: generated_ts_1.mantine.colors.disabledBorder,
        },
        body: {
            description: 'Disabled body color',
            value: generated_ts_1.mantine.colors.disabledBody,
        },
    },
    likec4: {
        background: {
            DEFAULT: {
                description: 'Background color',
                value: generated_ts_1.mantine.colors.body,
            },
            pattern: {
                description: 'Background pattern color',
                value: {
                    base: generated_ts_1.mantine.colors.gray[4],
                    _dark: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.dark[4], 70),
                },
            },
        },
        mixColor: {
            description: 'Color to be used in color-mix',
            value: {
                base: '#000',
                _dark: '#fff',
            },
        },
        tag: {
            bg: {
                DEFAULT: { value: "{colors.tomato.9}" },
                hover: { value: "{colors.tomato.10}" },
            },
            border: {
                value: "{colors.tomato.8}",
            },
            text: {
                value: "{colors.tomato.12}",
            },
        },
        panel: {
            bg: {
                DEFAULT: {
                    description: 'LikeC4 panel background color',
                    value: {
                        base: generated_ts_1.mantine.colors.body,
                        _dark: generated_ts_1.mantine.colors.dark[6],
                    },
                },
            },
            border: {
                description: 'LikeC4 panel border color',
                value: {
                    base: 'transparent',
                    _light: generated_ts_1.mantine.colors.gray[2],
                },
            },
            text: {
                DEFAULT: {
                    description: 'LikeC4 panel text color',
                    value: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.text, 85),
                },
                dimmed: {
                    description: 'LikeC4 panel dimmed text color',
                    value: '{colors.text.dimmed}',
                },
            },
            action: {
                DEFAULT: {
                    description: 'LikeC4 panel action text color (Links/Icons)',
                    value: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.text, 90),
                },
                disabled: {
                    description: 'LikeC4 action icon text color when disabled',
                    value: '{colors.text.dimmed}',
                },
                hover: {
                    description: 'LikeC4 panel action text color on hover',
                    value: 'var(--mantine-color-bright)',
                },
                bg: {
                    DEFAULT: {
                        description: 'LikeC4 action icon background color',
                        value: {
                            base: generated_ts_1.mantine.colors.gray[1],
                            _dark: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.dark[7], 70),
                        },
                    },
                    hover: {
                        description: 'LikeC4 action icon background color on hover',
                        value: {
                            base: generated_ts_1.mantine.colors.gray[2],
                            _dark: generated_ts_1.mantine.colors.dark[8],
                        },
                    },
                },
                warning: {
                    DEFAULT: {
                        description: 'LikeC4 action icon text color',
                        value: generated_ts_1.mantine.colors.orange[6],
                    },
                    hover: {
                        description: 'LikeC4 action icon text color on hover',
                        value: {
                            base: generated_ts_1.mantine.colors.orange[7],
                            _dark: generated_ts_1.mantine.colors.orange[5],
                        },
                    },
                    bg: {
                        DEFAULT: {
                            description: 'LikeC4 action icon background color',
                            value: {
                                base: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.orange[1], 90),
                                _dark: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.orange[9], 10),
                            },
                        },
                        hover: {
                            description: 'LikeC4 action icon background color on hover',
                            value: {
                                base: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.orange[3], 70),
                                _dark: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.orange[9], 20),
                            },
                        },
                    },
                },
            },
        },
        dropdown: {
            bg: {
                DEFAULT: {
                    description: 'LikeC4 dropdown background color',
                    value: {
                        base: "#FFF",
                        _dark: generated_ts_1.mantine.colors.dark[6],
                    },
                },
            },
            border: {
                description: 'LikeC4 dropdown border color',
                value: '{colors.likec4.panel.border}',
            },
        },
        overlay: {
            backdrop: {
                DEFAULT: {
                    description: 'LikeC4 overlay backdrop color',
                    value: {
                        base: "rgb(15 15 15)",
                        _dark: "rgb(34 34 34)",
                    },
                },
            },
            body: {
                DEFAULT: {
                    description: 'LikeC4 overlay body color',
                    value: {
                        base: generated_ts_1.mantine.colors.body,
                        _dark: generated_ts_1.mantine.colors.dark[6],
                    },
                },
            },
            border: {
                description: 'LikeC4 overlay border color',
                value: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.defaultBorder, 50),
            },
        },
        walkthrough: {
            parallelFrame: {
                description: 'LikeC4 walkthrough parallel frame color',
                value: {
                    _light: generated_ts_1.mantine.colors.orange[8],
                    _dark: generated_ts_1.mantine.colors.orange[6],
                },
            },
        },
        compare: {
            manual: {
                DEFAULT: {
                    description: 'LikeC4 Compare color for manual changes',
                    value: {
                        _light: generated_ts_1.mantine.colors.orange[8],
                        _dark: generated_ts_1.mantine.colors.orange[6],
                    },
                },
                outline: {
                    description: 'LikeC4 Compare color for outline around nodes with manual changes',
                    value: {
                        _light: generated_ts_1.mantine.colors.orange[8],
                        _dark: (0, helpers_ts_1.alpha)(generated_ts_1.mantine.colors.orange[6], 80),
                    },
                },
            },
            latest: {
                description: 'LikeC4 Compare color for latest changes',
                value: generated_ts_1.mantine.colors.green[6],
            },
        },
    },
});
