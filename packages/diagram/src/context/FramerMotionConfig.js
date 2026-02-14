"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FramerMotionConfig = void 0;
var core_1 = require("@mantine/core");
var react_1 = require("motion/react");
var FramerMotionConfig = function (_a) {
    var _b;
    var _c = _a.reducedMotion, reducedMotion = _c === void 0 ? 'user' : _c, children = _a.children;
    var nonce = (_b = (0, core_1.useMantineStyleNonce)()) === null || _b === void 0 ? void 0 : _b();
    return (<react_1.LazyMotion features={react_1.domMax} strict>
      <react_1.MotionConfig reducedMotion={reducedMotion} {...nonce && { nonce: nonce }}>
        {children}
      </react_1.MotionConfig>
    </react_1.LazyMotion>);
};
exports.FramerMotionConfig = FramerMotionConfig;
