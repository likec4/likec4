"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollArea = exports.pickviewGroup = exports.pickview = exports.pickviewBackdrop = exports.input = exports.focusable = void 0;
var css_1 = require("@likec4/styles/css");
var _shared_css_1 = require("./_shared.css");
Object.defineProperty(exports, "focusable", { enumerable: true, get: function () { return _shared_css_1.focusable; } });
exports.input = (0, css_1.css)({
    border: 'transparent',
    background: {
        base: 'transparent',
        _focusWithin: {
            base: "mantine.colors.gray[4]/55 !important",
            _dark: "mantine.colors.dark[5]/55 !important",
        },
        _groupHover: {
            base: 'mantine.colors.gray[3]/35',
            _dark: 'mantine.colors.dark[5]/35',
        },
    },
});
exports.pickviewBackdrop = (0, css_1.css)({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    backgroundColor: '[rgb(34 34 34 / 0.7)]',
    zIndex: 902,
    backdropFilter: 'auto',
    backdropBlur: '10px',
    _light: {
        backgroundColor: '[rgb(255 255 255 / 0.6)]',
    },
});
exports.pickview = (0, css_1.css)({
    position: 'absolute',
    top: '[2rem]',
    left: '[50%]',
    width: '100%',
    maxWidth: '600px',
    minWidth: '200px',
    transform: 'translateX(-50%)',
    zIndex: 903,
});
exports.pickviewGroup = (0, css_1.css)({
    marginTop: '2',
    '& + &': {
        marginTop: '[32px]',
    },
});
// globalStyle(`${whereDark} ${pickview} ${button}`, {
//   borderColor: mantine.colors.dark[5],
//   backgroundColor: mantine.colors.dark[6],
// })
// globalStyle(`${whereDark} ${pickview} ${button}:hover`, {
//   ...buttonFocused,
//   backgroundColor: `color-mix(in oklab, ${buttonFocused.backgroundColor}, transparent 40%)`,
// })
// globalStyle(`${whereDark} ${pickview} ${button}:focus`, buttonFocused)
exports.scrollArea = (0, css_1.css)({
    height: [
        '100%',
        '100cqh',
    ],
    '& .mantine-ScrollArea-viewport': {
        minHeight: '100%',
        '& > div': {
            minHeight: '100%',
            height: '100%',
        },
    },
});
