"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMantinePortalProps = useMantinePortalProps;
var react_1 = require("react");
var context_1 = require("../context");
function useMantinePortalProps() {
    var target = (0, context_1.useRootContainerElement)();
    return (0, react_1.useMemo)(function () { return target ? { portalProps: { target: target }, withinPortal: true } : { withinPortal: false }; }, [target]);
}
