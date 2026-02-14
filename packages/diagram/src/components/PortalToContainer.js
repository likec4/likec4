"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalToContainer = PortalToContainer;
var core_1 = require("@mantine/core");
var RootContainerContext_1 = require("../context/RootContainerContext");
/**
 * PortalToContainer is used to render elements outside the LikeC4DiagramXYFlow, but inside the container.
 * It is used internally by the library.
 */
function PortalToContainer(_a) {
    var _b;
    var children = _a.children;
    var ctx = (0, RootContainerContext_1.useRootContainerContext)();
    if (!ctx) {
        throw new Error('PortalToContainer must be used within RootContainer');
    }
    return <core_1.Portal target={(_b = ctx.ref.current) !== null && _b !== void 0 ? _b : ctx.selector}>{children}</core_1.Portal>;
}
