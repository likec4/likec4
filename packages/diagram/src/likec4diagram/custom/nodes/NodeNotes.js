"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNotes = NodeNotes;
var core_1 = require("@likec4/core");
var utils_1 = require("@likec4/core/utils");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var recipes_1 = require("@likec4/styles/recipes");
var core_2 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var react_1 = require("@xyflow/react");
var react_2 = require("motion/react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../../base-primitives");
var hooks_2 = require("../../../hooks");
function NodeNotes(_a) {
    var data = _a.data;
    if (!(0, core_1.hasProp)(data, 'notes') || (0, remeda_1.isEmptyish)(data.notes.md || data.notes.txt)) {
        return null;
    }
    return <NodeNotesInternal2 data={data}/>;
}
function stopPropagation(e) {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
}
function NodeNotesInternal2(_a) {
    var data = _a.data;
    return <NodeNotesInternal data={data}/>;
    // return (
    //   <div className={nodeNotes({})}>
    //     <div className="__paper"></div>
    //   </div>
    // )
}
function NodeNotesInternal(_a) {
    var _b, _c, _d, _e;
    var data = _a.data;
    var markdown = data.notes;
    var width = (0, remeda_1.clamp)((_b = data.width) !== null && _b !== void 0 ? _b : 0, {
        min: 250,
        max: 500,
    });
    var height = (0, remeda_1.clamp)((_c = data.height) !== null && _c !== void 0 ? _c : 0, {
        min: 200,
        max: 600,
    });
    var _f = (0, hooks_1.useDisclosure)(false, {}), expanded = _f[0], handlers = _f[1];
    var id = (0, utils_1.stringHash)(data.id + ((_d = markdown.md) !== null && _d !== void 0 ? _d : markdown.txt));
    var onClickCapture = (0, hooks_2.useCallbackRef)(function (e) {
        if (e) {
            e.preventDefault();
            if ('nativeEvent' in e) {
                e.nativeEvent.stopImmediatePropagation();
            }
            e.stopPropagation();
        }
        handlers.toggle();
    });
    var hovered = (_e = data.hovered) !== null && _e !== void 0 ? _e : false;
    var layoutDependency = expanded; // || hovered
    return (<>
      <react_2.AnimatePresence>
        <react_2.m.div key={"node-notes-".concat(id)} 
    // layoutDependency={layoutDependency}
    className={(0, css_1.cx)('nopan nodrag', (0, recipes_1.nodeNotes)({ opened: expanded }))} variants={variants.root} initial={'initial'} animate={expanded ? 'expanded' : hovered ? 'hovered' : 'initial'} whileHover={'whileHover'} exit={'exit'} {...(!expanded && { onPointerDownCapture: onClickCapture })} onMouseDownCapture={onClickCapture} onClickCapture={onClickCapture} onClick={stopPropagation} data-state={expanded ? 'expanded' : 'collapsed'}>
          <react_2.m.div key="paper-back" variants={variants.paper1} className={'__paper __paper-back'}/>
          {!expanded && (<react_2.m.div key={id} layout layoutId={id} variants={variants.paper2} data-state={expanded ? 'expanded' : 'collapsed'} className={'__paper __paper-front'}/>)}
        </react_2.m.div>
        {expanded && (<react_1.ViewportPortal key={'portal'}>
            <react_2.m.div key={id} layout layoutDependency={layoutDependency} layoutId={id} className={(0, css_1.css)({
                position: 'absolute',
                zIndex: 300,
                top: '0',
                left: '0',
                display: 'flex',
                pointerEvents: 'all',
                rounded: 'sm',
                backgroundColor: 'likec4.overlay.body',
                padding: '0',
                alignItems: 'stretch',
                justifyContent: 'stretch',
                overflow: 'hidden',
                width: 'fit-content',
                height: 'fit-content',
                maxHeight: '70cqh',
                maxWidth: '50cqw',
                // minHeight: '60cqh',
            })} data-likec4-notes={id} style={{
                top: data.y + 20,
                left: data.x + 10,
                maxWidth: "min(calc(".concat(width, "px * 2), 50cqw)"),
                // minHeight: `max(${height}px, 60cqh)`,
                // maxHeight: height,
            }} onMouseDownCapture={stopPropagation} onClickCapture={stopPropagation} onClick={stopPropagation}>
              <core_2.ScrollAreaAutosize component={react_2.m.div} className={(0, css_1.cx)('nowheel', (0, css_1.css)({
                flex: '1',
                padding: 'xs',
                paddingRight: 'xxs',
            }))}>
                <base_primitives_1.Markdown className={(0, css_1.css)({
                paddingRight: 'xxs',
            })} value={core_1.RichText.from(markdown)}/>
              </core_2.ScrollAreaAutosize>
            </react_2.m.div>
          </react_1.ViewportPortal>)}
      </react_2.AnimatePresence>
      {expanded && (<Catch data={data} onCatchClick={onClickCapture}/>)}
    </>);
}
var base_paper1 = {
    rotateZ: '-5deg',
    y: 0,
    x: 1,
    scale: 1,
    originX: '55%',
    originY: '80%',
};
var base_paper2 = {
    rotateZ: '3deg',
    y: -2,
    scale: 1,
    backgroundColor: 'color-mix(in oklab, var(--likec4-palette-fill) 8%, #FFF)',
    originX: '45%',
    originY: '80%',
};
var variants = {
    root: {
        initial: (_a = {},
            _a['--paper-bg'] = 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)',
            _a),
        hovered: {},
        whileHover: (_b = {},
            _b['--paper-bg'] = 'color-mix(in oklab, var(--likec4-palette-fill) 3%, #FFF)',
            _b),
        exit: (_c = {},
            _c['--paper-bg'] = 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)',
            _c),
    },
    // PAPER BACK
    paper1: {
        initial: __assign(__assign({}, base_paper1), { rotateZ: '-3.5deg', y: 1, scale: .95 }),
        hovered: __assign({}, base_paper1),
        whileHover: __assign(__assign({}, base_paper1), (_d = {}, _d['--paper-bg'] = 'color-mix(in oklab, var(--likec4-palette-fill) 3%, #FFF)', _d.scale = 1.04, _d)),
        expanded: __assign(__assign({}, base_paper1), { y: [0, 1, 20], scale: .95 }),
        exit: __assign(__assign({}, base_paper1), { rotateZ: '-3.5deg', y: 1, scale: .95 }),
    },
    // PAPER FRONT
    paper2: {
        initial: __assign(__assign({}, base_paper2), { rotateZ: '2deg', y: 2, scale: .95, backgroundColor: 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)' }),
        hovered: __assign({}, base_paper2),
        whileHover: __assign(__assign({}, base_paper2), { scale: 1.08 }),
        expanded: __assign(__assign({}, base_paper2), { y: [0, 1, 20], scale: .95 }),
        exit: __assign(__assign({}, base_paper2), { rotateZ: '2deg', y: 2, scale: .95, backgroundColor: 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)' }),
    },
};
function Catch(_a) {
    var _b, _c;
    var data = _a.data, onCatchClick = _a.onCatchClick;
    (0, hooks_2.useOnDiagramEvent)('paneClick', function () {
        onCatchClick();
    });
    return (<react_1.ViewportPortal key="catch-all">
      <jsx_1.Box css={{
            display: 'block',
            position: 'absolute',
            zIndex: 200,
            pointerEvents: 'all',
            left: '0',
            top: '0',
            cursor: 'zoom-out',
        }} style={{
            transform: "translate(".concat(data.x - 40, "px, ").concat(data.y - 40, "px)"),
            width: ((_b = data.width) !== null && _b !== void 0 ? _b : 250) + 80,
            height: ((_c = data.height) !== null && _c !== void 0 ? _c : 200) + 80,
        }} onMouseDownCapture={onCatchClick} onClickCapture={onCatchClick} onClick={stopPropagation}>
      </jsx_1.Box>
    </react_1.ViewportPortal>);
}
