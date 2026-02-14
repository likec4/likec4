"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationLink = void 0;
var dev_1 = require("@pandacss/dev");
var generated_ts_1 = require("../generated.ts");
exports.navigationLink = (0, dev_1.defineSlotRecipe)({
    className: 'likec4-navlink',
    description: 'Navigation Link (classes for Mantine NavLink)',
    jsx: ['NavLink'],
    slots: ['root', 'body', 'section', 'label', 'description'],
    base: {
        root: {
            rounded: 'sm',
            px: 'xs',
            py: 'xxs',
            backgroundColor: {
                _hover: {
                    '&:not([data-active])': {
                        base: generated_ts_1.mantine.colors.gray[1],
                        _dark: generated_ts_1.mantine.colors.dark[5],
                    },
                },
            },
        },
        body: {
            gap: '0.5',
            display: 'flex',
            flexDirection: 'column',
        },
        section: {
            '&:where([data-position="left"])': {
                marginInlineEnd: 'xxs',
                // alignSelf: 'flex-start',
            },
        },
        label: {
            display: 'block',
            fontSize: 'sm',
            fontWeight: '500',
            lineHeight: 1.2,
        },
        description: {
            display: 'block',
            fontSize: 'xxs',
            lineHeight: 1.2,
        },
    },
    variants: {
        truncateLabel: {
            'true': {
                label: {
                    width: '100%',
                    truncate: true,
                },
                description: {
                    width: '100%',
                    truncate: true,
                },
            },
            'false': {},
        },
    },
    defaultVariants: {
        truncateLabel: false,
    },
    staticCss: [{
            truncateLabel: ['*'],
            conditions: ['*'],
        }],
});
