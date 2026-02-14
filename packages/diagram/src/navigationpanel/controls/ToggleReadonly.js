"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleReadonly = void 0;
var css_1 = require("@likec4/styles/css");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var remeda_1 = require("remeda");
var useDiagram_1 = require("../../hooks/useDiagram");
var machine_setup_1 = require("../../likec4diagram/state/machine.setup");
var selector = function (ctx) {
    var _a;
    var toggledFeatures = (0, machine_setup_1.deriveToggledFeatures)(ctx);
    // Disable readonly toggle, if any of these conditions is true:
    var comparingLatest = toggledFeatures.enableCompareWithLatest && !!ctx.view.drifts && ctx.view._layout === 'auto';
    // const sequenceLayoutActive = ctx.view._type === 'dynamic' && ctx.dynamicViewVariant === 'sequence'
    // If All condition is true, we show toggle
    var noActiveWalkthrough = !(0, remeda_1.isTruthy)(ctx.activeWalkthrough);
    var hasEditor = ctx.features.enableEditor;
    return ({
        visible: hasEditor && noActiveWalkthrough,
        disabled: comparingLatest,
        isReadOnly: (_a = ctx.toggledFeatures.enableReadOnly) !== null && _a !== void 0 ? _a : false,
    });
};
var ToggleReadonly = function () {
    var _a = (0, useDiagram_1.useDiagramContext)(selector), visible = _a.visible, disabled = _a.disabled, isReadOnly = _a.isReadOnly;
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<react_1.AnimatePresence mode="popLayout">
      {visible && (<core_1.UnstyledButton component={m.button} layout="position" layoutDependency={isReadOnly} disabled={disabled} onClick={function (e) {
                e.stopPropagation();
                !disabled && diagram.toggleFeature('ReadOnly');
            }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: disabled ? 0.95 : 1 }} exit={{ opacity: 0, scale: 0.6 }} whileTap={{
                translateY: 1,
            }} className={(0, css_1.cx)('group', (0, patterns_1.hstack)({
                gap: '0.5',
                paddingInline: 'xxs',
                paddingBlock: 'xxs',
                userSelect: 'none',
                layerStyle: 'likec4.panel.action',
                backgroundColor: {
                    base: 'none',
                    _notDisabled: {
                        _hover: 'likec4.panel.action.bg.hover',
                    },
                },
            }))}>
          <icons_react_1.IconLockOpen2 size={14} stroke={2} style={{ display: isReadOnly ? 'none' : undefined }}/>
          <icons_react_1.IconLock size={14} stroke={2} style={{ display: !isReadOnly ? 'none' : undefined }}/>
          <m.div className={(0, css_1.css)({
                fontSize: '11px',
                fontWeight: 'bold',
                lineHeight: 1,
                opacity: 0.8,
            })} style={{
                display: isReadOnly ? 'block' : 'none',
            }}>
            Edit
          </m.div>
        </core_1.UnstyledButton>)}
    </react_1.AnimatePresence>);
};
exports.ToggleReadonly = ToggleReadonly;
