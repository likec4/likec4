"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textStyles = void 0;
var dev_1 = require("@pandacss/dev");
function defineTextStyles(definition) {
    return (0, dev_1.defineTextStyles)(definition);
}
exports.textStyles = defineTextStyles({
    dimmed: {
        DEFAULT: {
            description: 'Text style for dimmed content',
            value: {
                fontSize: 'md',
                lineHeight: 'md',
                color: 'text.dimmed',
            },
        },
        xxs: {
            value: {
                fontSize: 'xxs',
                lineHeight: 'xxs',
                color: 'text.dimmed',
            },
        },
        xs: {
            value: {
                fontSize: 'xs',
                lineHeight: 'xs',
                color: 'text.dimmed',
            },
        },
        sm: {
            value: {
                fontSize: 'sm',
                lineHeight: 'sm',
                color: 'text.dimmed',
            },
        },
        md: {
            value: {
                fontSize: 'md',
                lineHeight: 'md',
                color: 'text.dimmed',
            },
        },
    },
    xxs: {
        value: {
            fontSize: 'xxs',
            lineHeight: 'xxs',
        },
    },
    xs: {
        value: {
            fontSize: 'xs',
            lineHeight: 'xs',
        },
    },
    sm: {
        value: {
            fontSize: 'sm',
            lineHeight: 'sm',
        },
    },
    md: {
        value: {
            fontSize: 'md',
            lineHeight: 'md',
        },
    },
    lg: {
        value: {
            fontSize: 'lg',
            lineHeight: 'lg',
        },
    },
    xl: {
        value: {
            fontSize: 'xl',
            lineHeight: 'xl',
        },
    },
    likec4: {
        DEFAULT: {
            description: 'Text style for panel content',
            value: {
                fontSize: 'md',
                lineHeight: 'md',
                fontWeight: 'normal',
                color: 'text',
            },
        },
        panel: {
            DEFAULT: {
                description: 'Text style for panel content',
                value: {
                    fontSize: 'sm',
                    lineHeight: 'sm',
                    fontWeight: 'medium',
                    color: 'likec4.panel.text',
                },
            },
            action: {
                description: 'Text style for panel action items',
                value: {
                    fontSize: 'sm',
                    lineHeight: 'sm',
                    fontWeight: 'medium',
                    color: {
                        base: 'likec4.panel.action',
                        _hover: 'likec4.panel.action.hover',
                    },
                },
            },
        },
    },
});
