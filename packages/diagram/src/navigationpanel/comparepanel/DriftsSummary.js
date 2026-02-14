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
exports.DriftsSummary = DriftsSummary;
var fast_equals_1 = require("fast-equals");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var hooks_1 = require("@mantine/hooks");
var react_1 = require("motion/react");
var remeda_1 = require("remeda");
var hooks_2 = require("../../hooks");
var hasDrifts = function (item) {
    return !!item.drifts && (0, remeda_1.hasAtLeast)(item.drifts, 1);
};
var selectDrifts = (0, hooks_2.selectDiagramActorContext)(function (ctx) {
    var _a;
    return ({
        view: (_a = ctx.view.drifts) !== null && _a !== void 0 ? _a : [],
        nodes: (0, remeda_1.pipe)(ctx.view.nodes, (0, remeda_1.map)(function (node) { return ({
            id: node.id,
            name: node.title,
            drifts: node.drifts,
        }); }), (0, remeda_1.filter)(hasDrifts)),
        edges: (0, remeda_1.pipe)(ctx.view.edges, (0, remeda_1.map)(function (edge) { return ({
            edgeId: edge.id,
            drifts: edge.drifts,
        }); }), (0, remeda_1.filter)(hasDrifts)),
    });
});
var variants = {
    initial: {
        opacity: 0,
        translateY: -8,
    },
    animate: {
        opacity: 1,
        translateY: 0,
        transition: {
            delayChildren: (0, react_1.stagger)(0.1),
        },
    },
    exit: {
        opacity: 0,
        translateY: -8,
        transition: {
            delayChildren: (0, react_1.stagger)(0.2, { startDelay: .5, from: 'last' }),
        },
    },
};
function DriftsSummary() {
    var selected = (0, hooks_2.useDiagramSnapshot)(selectDrifts, fast_equals_1.deepEqual);
    var diagram = (0, hooks_2.useDiagram)();
    var onMouseLeaveDebounced = (0, hooks_1.useDebouncedCallback)(function (e) {
        e.stopPropagation();
        diagram.unhighlightAll();
    }, 150);
    var onMouseEnter = (0, hooks_2.useCallbackRef)(function (e) {
        var target = e.currentTarget.getAttribute('data-drift-type');
        var id = e.currentTarget.getAttribute('data-drift-id');
        if (target === 'node' && id) {
            e.stopPropagation();
            onMouseLeaveDebounced.cancel();
            diagram.highlightNode(id);
            return;
        }
        if (target === 'edge' && id) {
            e.stopPropagation();
            onMouseLeaveDebounced.cancel();
            diagram.highlightEdge(id);
            return;
        }
    });
    var onClick = (0, hooks_2.useCallbackRef)(function (e) {
        var target = e.currentTarget.getAttribute('data-drift-type');
        var id = e.currentTarget.getAttribute('data-drift-id');
        if (target === 'node' && id) {
            e.stopPropagation();
            diagram.centerViewportOnNode(id);
            return;
        }
        if (target === 'edge' && id) {
            e.stopPropagation();
            diagram.centerViewportOnEdge(id);
            return;
        }
    });
    var handlers = {
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeaveDebounced,
        onClick: onClick,
    };
    var view = selected.view, nodes = selected.nodes, edges = selected.edges;
    if (view.length === 0 && nodes.length === 0 && edges.length === 0) {
        return null;
    }
    return (<react_1.AnimatePresence propagate mode="wait">
      <react_1.m.div key={"drifts-summary"} layout="size" variants={variants} initial="initial" animate="animate" exit="exit" layoutDependency={selected} className={(0, patterns_1.vstack)({
            mx: '[calc({spacing.2} * -1)]',
            px: '2',
            flex: '1',
            height: '100%',
            overflow: 'scroll',
            gap: '4',
        })}>
        {(0, remeda_1.hasAtLeast)(view, 1) && <ViewDrifts drifts={view}/>}
        {nodes.length > 0 && (<react_1.m.div key={"nodes-drifts"} layout="size">
            <SectionHeader>Elements:</SectionHeader>
            <react_1.m.div layout="size" className={(0, patterns_1.vstack)({ mt: '2', gap: '2' })}>
              {(0, remeda_1.map)(nodes, function (node) { return <NodeDrifts key={node.id} {...node} {...handlers}/>; })}
            </react_1.m.div>
          </react_1.m.div>)}
        {edges.length > 0 && (<react_1.m.div key={"edges-drifts"} layout="size">
            <SectionHeader>Relationships:</SectionHeader>
            <react_1.m.div layout="size" className={(0, patterns_1.vstack)({ mt: '2', gap: '2' })}>
              {(0, remeda_1.map)(edges, function (edge) { return <EdgeDrifts key={edge.edgeId} {...edge} {...handlers}/>; })}
            </react_1.m.div>
          </react_1.m.div>)}
      </react_1.m.div>
    </react_1.AnimatePresence>);
}
function ViewDrifts(_a) {
    var drifts = _a.drifts;
    return (<>
      <react_1.m.div key={"view-drifts-header"} layout="position" className={(0, patterns_1.vstack)({
            gap: '2',
        })}>
        <SectionHeader>View drifts (summary):</SectionHeader>
        <DriftsGroup key={"view-drifts"}>
          {(0, remeda_1.map)(drifts, function (drift) { return <DriftLabel key={drift}>{drift}</DriftLabel>; })}
        </DriftsGroup>
      </react_1.m.div>
    </>);
}
function NodeDrifts(_a) {
    var id = _a.id, name = _a.name, drifts = _a.drifts, handlers = __rest(_a, ["id", "name", "drifts"]);
    return (<DriftsGroup key={"node-drifts-".concat(id)} data-drift-type="node" data-drift-id={id} {...handlers}>
      <jsx_1.Txt truncate css={{
            maxWidth: {
                base: 160,
                '@/sm': 180,
                '@/md': 250,
            },
        }} color={'likec4.compare.manual.outline'} fontSize={'xs'} lineHeight={'sm'} fontWeight={'medium'}>
        {name}
      </jsx_1.Txt>
      {(0, remeda_1.map)(drifts, function (drift) { return <DriftLabel key={id + drift}>{drift}</DriftLabel>; })}
    </DriftsGroup>);
}
function EdgeDrifts(_a) {
    var edgeId = _a.edgeId, drifts = _a.drifts, handlers = __rest(_a, ["edgeId", "drifts"]);
    return (<DriftsGroup key={"edge-drifts-".concat(edgeId)} data-drift-type="edge" data-drift-id={edgeId} {...handlers}>
      {(0, remeda_1.map)(drifts, function (drift) { return (<DriftLabel key={edgeId + drift}>
          {drift}
        </DriftLabel>); })}
    </DriftsGroup>);
}
var DriftsGroup = (0, jsx_1.styled)(react_1.m.div, {
    base: patterns_1.vstack.raw({
        gap: '1',
        px: '3',
        py: '2',
        cursor: 'default',
        rounded: 'sm',
        backgroundColor: 'likec4.compare.manual/10',
        border: '1px solid {colors.likec4.compare.manual.outline/20}',
        _hover: {
            backgroundColor: 'likec4.compare.manual/20',
            borderColor: 'likec4.compare.manual.outline/25',
        },
    }),
}, {
    defaultProps: {
        className: 'group',
        variants: variants,
        layout: 'size',
        initial: 'initial',
        animate: 'animate',
        exit: 'exit',
    },
});
var SectionHeader = (0, jsx_1.styled)(react_1.m.div, {
    base: {
        userSelect: 'none',
        fontWeight: 'medium',
        textStyle: 'dimmed.xs',
        pl: '2',
    },
}, {
    defaultProps: {
        variants: variants,
        layout: 'position',
        initial: 'initial',
        animate: 'animate',
        exit: 'exit',
    },
});
var DriftLabel = (0, jsx_1.styled)(react_1.m.div, {
    base: {
        userSelect: 'none',
        textStyle: 'xs',
        color: {
            base: 'text',
            _groupHover: 'text.bright',
        },
    },
}, {
    defaultProps: {
        variants: variants,
        layout: 'position',
        initial: 'initial',
        animate: 'animate',
        exit: 'exit',
    },
});
