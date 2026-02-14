"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Overlay = void 0;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var react_1 = require("motion/react");
var react_2 = require("react");
var utils_1 = require("../../utils");
var backdropBlur = '--_blur';
var backdropOpacity = '--_opacity';
var cssVarLevel = '--_level';
exports.Overlay = (0, react_2.forwardRef)(function (_a, ref) {
    var _b, _c, _d, _e, _f;
    var onClose = _a.onClose, className = _a.className, classes = _a.classes, _g = _a.overlayLevel, overlayLevel = _g === void 0 ? 0 : _g, children = _a.children, _h = _a.fullscreen, fullscreen = _h === void 0 ? false : _h, _j = _a.withBackdrop, withBackdrop = _j === void 0 ? true : _j, backdrop = _a.backdrop, _k = _a.openDelay, openDelay = _k === void 0 ? 130 : _k, rest = __rest(_a, ["onClose", "className", "classes", "overlayLevel", "children", "fullscreen", "withBackdrop", "backdrop", "openDelay"]);
    var _l = (0, react_2.useState)(openDelay === 0), opened = _l[0], setOpened = _l[1];
    var focusTrapRef = (0, hooks_1.useFocusTrap)(opened);
    var dialogRef = (0, react_2.useRef)(null);
    var isClosingRef = (0, react_2.useRef)(false);
    var motionNotReduced = (0, react_1.useReducedMotionConfig)() !== true;
    var onCloseRef = (0, react_2.useRef)(onClose);
    onCloseRef.current = onClose;
    var close = (0, web_1.useDebouncedCallback)(function () {
        if (isClosingRef.current)
            return;
        isClosingRef.current = true;
        onCloseRef.current();
    }, [], 50);
    (0, react_2.useLayoutEffect)(function () {
        var _a, _b;
        if (!((_a = dialogRef.current) === null || _a === void 0 ? void 0 : _a.open)) {
            // Move dialog to the top of the DOM
            (_b = dialogRef.current) === null || _b === void 0 ? void 0 : _b.showModal();
        }
    }, []);
    (0, web_1.useTimeoutEffect)(function () {
        setOpened(true);
    }, openDelay > 0 ? openDelay : undefined);
    var overlayRecipe = (0, recipes_1.overlay)({
        fullscreen: fullscreen,
        withBackdrop: withBackdrop,
    });
    var targetBackdropOpacity = overlayLevel > 0 ? '50%' : '60%';
    if ((backdrop === null || backdrop === void 0 ? void 0 : backdrop.opacity) !== undefined) {
        targetBackdropOpacity = "".concat(backdrop.opacity * 100, "%");
    }
    return (<react_1.m.dialog ref={(0, hooks_1.useMergedRef)(dialogRef, focusTrapRef, ref)} className={(0, css_1.cx)(classes === null || classes === void 0 ? void 0 : classes.dialog, className, overlayRecipe, 
        // styles.dialog,
        fullscreen && core_1.RemoveScroll.classNames.fullWidth)} layout style={_b = {},
            // @ts-ignore
            _b[cssVarLevel] = overlayLevel,
            _b} {...motionNotReduced
        ? ({
            initial: (_c = {},
                _c[backdropBlur] = '0px',
                _c[backdropOpacity] = '0%',
                _c.scale = 0.85,
                // originY: 0.4,
                // translateY: -10,
                _c.opacity = 0,
                _c),
            animate: (_d = {},
                _d[backdropBlur] = overlayLevel > 0 ? '4px' : '8px',
                _d[backdropOpacity] = targetBackdropOpacity,
                _d.scale = 1,
                _d.opacity = 1,
                _d.translateY = 0,
                _d),
            exit: (_e = {
                    opacity: 0,
                    scale: 0.98,
                    translateY: -20
                },
                // transition: {
                //   duration: 0.1,
                // },
                _e[backdropBlur] = '0px',
                _e[backdropOpacity] = '0%',
                _e),
        })
        : {
            initial: (_f = {},
                _f[backdropBlur] = '8px',
                _f[backdropOpacity] = targetBackdropOpacity,
                _f),
        }} onClick={function (e) {
            var _a, _b, _c;
            e.stopPropagation();
            if (((_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.nodeName) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === 'DIALOG') {
                (_c = dialogRef.current) === null || _c === void 0 ? void 0 : _c.close();
                return;
            }
        }} onCancel={function (e) {
            e.preventDefault();
            e.stopPropagation();
            close();
        }} onDoubleClick={utils_1.stopPropagation} onPointerDown={utils_1.stopPropagation} onClose={function (e) {
            e.stopPropagation();
            close();
        }} {...rest}>
      <core_1.RemoveScroll forwardProps>
        <div className={(0, css_1.cx)(classes === null || classes === void 0 ? void 0 : classes.body, 'likec4-overlay-body')}>
          {opened && <>{children}</>}
        </div>
      </core_1.RemoveScroll>
    </react_1.m.dialog>);
});
exports.Overlay.displayName = 'Overlay';
