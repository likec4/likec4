"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeNoteText = exports.edgeNoteCloseButton = void 0;
var css_1 = require("@likec4/styles/css");
// import { mantine } from '../../../theme-vars'
exports.edgeNoteCloseButton = (0, css_1.css)({
    position: 'absolute',
    top: '[1px]',
    right: '[1px]',
    zIndex: 9,
});
exports.edgeNoteText = (0, css_1.css)({
    userSelect: 'all',
    textAlign: 'left',
    whiteSpaceCollapse: 'preserve-breaks',
    textWrap: 'pretty',
    lineHeight: 1.25,
    '--text-fz': '{fontSizes.sm}',
    md: {
        '--text-fz': '{fontSizes.md}',
    },
});
