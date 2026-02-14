"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeNotes = void 0;
var dev_1 = require("@pandacss/dev");
var const_ts_1 = require("../const.ts");
var parts = (0, dev_1.defineParts)({
    root: { selector: '&' },
    paper: { selector: '& .__paper' },
    // paperBack: { selector: '& .__paper:is(.__paper-back)' },
    // paperFront: { selector: '& .__paper:is(.__paper-front)' },
    popover: { selector: '& .__popover' },
});
exports.nodeNotes = (0, dev_1.defineRecipe)({
    className: 'likec4-node-notes',
    jsx: ['NodeNotesr'],
    base: parts({
        root: {
            position: 'absolute',
            top: '-20px',
            left: '10px',
            width: '120px',
            height: '60px',
            pointerEvents: 'all',
            userSelect: 'none',
            appearance: 'none',
            touchAction: 'manipulation',
            overflow: 'visible',
            '--paper-bg': "color-mix(in oklab, ".concat((0, const_ts_1.__v)('palette.fill'), " 10%, #DDD)"),
        },
        paper: {
            pointerEvents: 'all',
            position: 'absolute',
            top: '14px',
            left: '10px',
            width: '90px',
            height: '120px',
            boxShadow: [
                'inset 0 0 20px rgba(0, 0, 0, 0.25)',
                '0px 0px 3px 0px rgba(0, 0, 0, 0.35)',
            ].join(', '),
            backgroundColor: 'oklch(from var(--paper-bg) calc(l - 0.1) c h)',
            zIndex: -1,
            transform: 'rotateZ(-3deg)',
            transformOrigin: '55% 90% 0',
            overflow: 'visible',
            transition: 'faster',
            transitionDelay: '20ms',
            _before: {
                position: 'absolute',
                zIndex: -1,
                content: '" "',
                width: '100%',
                height: '100%',
                transform: 'rotateZ(6deg) translate(-2px, 0px)',
                transformOrigin: '45% 90% 0',
                boxShadow: [
                    'inset 0 0 20px rgba(0, 0, 0, 0.25)',
                    '0px 0px 3px 0px rgba(0, 0, 0, 0.35)',
                ].join(', '),
                backgroundColor: 'var(--paper-bg)',
            },
            _whenHovered: {
                transform: 'rotateZ(-4deg) scale(1.06)',
                _before: {
                    transform: 'translate(-1px, -2px) rotateZ(6deg) scale(1.02)', // scale(1.025)',
                    // transform: 'rotateZ(7.5deg) scale(1.01)',
                },
            },
            // _hover: {
            //   // transform: 'rotateZ(-4deg) scale(1.06)',
            //   _before: {
            //     transform: 'translate(-1px, -2px) rotateZ(6deg) scale(1.04)', // scale(1.025)',
            //     // transform: 'rotateZ(7.5deg) scale(1.01)',
            //   },
            // },
        },
        // paperBack: {
        //   width: '77px',
        //   height: '110px',
        //   background: `oklch(from var(--paper-bg) calc(l - 0.1) c h)`,
        //   zIndex: -1,
        // },
        // paperFront: {
        //   top: '8px',
        //   left: '20px',
        //   width: '80px',
        //   height: '120px',
        //   background: `var(--paper-bg)`,
        //   zIndex: -1,
        //   boxShadow: [
        //     'inset 0 0 20px rgba(0, 0, 0, 0.25)',
        //     '0px 0px 3px 0px rgba(0, 0, 0, 0.35)',
        //   ].join(', '),
        //   _after: {
        //     paddingLeft: '2',
        //     paddingTop: '5px',
        //     fontSize: '7px',
        //     content: '"NOTES"',
        //     fontWeight: 'bold',
        //     lineHeight: '1',
        //     color: {
        //       base: mantine.colors.text,
        //       _dark: mantine.colors.gray[7],
        //     },
        //   },
        //   _expanded: {
        //     _after: {
        //       display: 'none',
        //     },
        //   },
        // },
        popover: {
            position: 'absolute',
            w: 'auto',
            h: 'auto',
            zIndex: 300,
            top: '0',
            left: '0',
            display: 'block',
            pointerEvents: 'all',
            rounded: 'sm',
            backgroundColor: 'likec4.overlay.body',
            padding: 'sm',
        },
    }),
    variants: {
        opened: {
            false: parts({
            // paperFront: {
            //   _after: {
            //   },
            // },
            }),
            true: parts({
            // paperFront: {
            //   _after: {
            //     display: 'none',
            //   },
            // },
            }),
        },
    },
    defaultVariants: {
        opened: false,
    },
    staticCss: [{
            opened: ['*'],
        }],
});
