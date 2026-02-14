"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalkthroughPanel = void 0;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_2 = require("@mantine/core");
var react_1 = require("motion/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../base-primitives");
var useDiagram_1 = require("../../hooks/useDiagram");
var SectionHeader = (0, jsx_1.styled)('div', {
    base: {
        fontSize: 'xs',
        color: 'text.dimmed',
        fontWeight: 'medium',
        userSelect: 'none',
        mb: 'xxs',
    },
});
function selectWalkthroughNotes(s) {
    var _a, _b, _c, _d;
    var isActive = (0, remeda_1.isNonNull)(s.activeWalkthrough);
    var activeStepIndex = isActive ? s.xyedges.findIndex(function (e) { var _a; return e.id === ((_a = s.activeWalkthrough) === null || _a === void 0 ? void 0 : _a.stepId); }) : -1;
    return {
        isActive: isActive,
        isParallel: isActive && (0, remeda_1.isTruthy)((_a = s.activeWalkthrough) === null || _a === void 0 ? void 0 : _a.parallelPrefix),
        hasNext: isActive && activeStepIndex < s.xyedges.length - 1,
        hasPrevious: isActive && activeStepIndex > 0,
        notes: isActive ? (_d = (_c = (_b = s.xyedges[activeStepIndex]) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.notes) !== null && _d !== void 0 ? _d : null : null,
    };
}
exports.WalkthroughPanel = (0, react_2.memo)(function () {
    var _a = (0, useDiagram_1.useDiagramContext)(selectWalkthroughNotes), isActive = _a.isActive, _notes = _a.notes;
    var notes = _notes ? core_1.RichText.from(_notes) : core_1.RichText.EMPTY;
    return (<react_1.AnimatePresence>
      {isActive && !notes.isEmpty && (<react_1.m.div layout="position" className={(0, css_1.css)({
                position: 'relative',
            })} initial={{
                opacity: 0,
                translateX: -20,
            }} animate={{
                opacity: 1,
                translateX: 0,
            }} exit={{
                opacity: 0,
                translateX: -20,
            }}>
          <core_2.ScrollAreaAutosize className={(0, patterns_1.vstack)({
                position: 'absolute',
                layerStyle: 'likec4.dropdown',
                gap: 'sm',
                padding: 'md',
                paddingTop: 'xxs',
                pointerEvents: 'all',
                maxWidth: 'calc(100cqw - 32px)',
                minWidth: 'calc(100cqw - 50px)',
                maxHeight: 'calc(100cqh - 100px)',
                width: 'max-content',
                cursor: 'default',
                overflow: 'auto',
                overscrollBehavior: 'contain',
                '@/sm': {
                    minWidth: 400,
                    maxWidth: 550,
                },
                '@/lg': {
                    maxWidth: 700,
                },
            })} type="scroll">
            <SectionHeader>Notes</SectionHeader>
            <base_primitives_1.Markdown value={notes} fontSize="sm" emptyText="No description" className={(0, css_1.css)({
                userSelect: 'all',
            })}/>
          </core_2.ScrollAreaAutosize>
        </react_1.m.div>)}
    </react_1.AnimatePresence>);
});
