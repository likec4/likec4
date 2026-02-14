"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootContainer = RootContainer;
var css_1 = require("@likec4/styles/css");
var react_1 = require("@nanostores/react");
var nanostores_1 = require("nanostores");
var react_2 = require("react");
var RootContainerContext_1 = require("../context/RootContainerContext");
function RootContainer(_a) {
    var _b;
    var id = _a.id, className = _a.className, _c = _a.reduceGraphics, reduceGraphics = _c === void 0 ? false : _c, children = _a.children;
    var ref = (0, react_2.useRef)(null);
    var $isPanning = (0, react_2.useState)(function () { return (0, nanostores_1.atom)(false); })[0];
    var isPanning = (0, react_1.useStore)($isPanning);
    var ctx = (0, react_2.useMemo)(function () { return ({ id: id, ref: ref, selector: "#".concat(id) }); }, [id, ref]);
    return (<RootContainerContext_1.ReduceGraphicsModeProvider value={reduceGraphics}>
      <RootContainerContext_1.PanningAtomSafeCtx value={$isPanning}>
        <div id={id} className={(0, css_1.cx)('likec4-root', className)} ref={ref} data-likec4-diagram-panning={isPanning} {...reduceGraphics && (_b = {},
        _b['data-likec4-reduced-graphics'] = true,
        _b)}>
          <RootContainerContext_1.RootContainerContextProvider value={ctx}>
            {children}
          </RootContainerContext_1.RootContainerContextProvider>
        </div>
      </RootContainerContext_1.PanningAtomSafeCtx>
    </RootContainerContext_1.ReduceGraphicsModeProvider>);
}
