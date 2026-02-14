"use strict";
// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipPopover = void 0;
var dom_1 = require("@floating-ui/dom");
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_2 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../base-primitives");
var Link_1 = require("../../components/Link");
var PortalToContainer_1 = require("../../components/PortalToContainer");
var context_1 = require("../../context");
var DiagramEventHandlers_1 = require("../../context/DiagramEventHandlers");
var DiagramFeatures_1 = require("../../context/DiagramFeatures");
var useDiagram_1 = require("../../hooks/useDiagram");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var utils_1 = require("../../utils");
var utils_2 = require("../state/utils");
var actor_1 = require("./actor");
var components_1 = require("./components");
function selectDiagramContext(c) {
    var selected = null;
    for (var _i = 0, _a = c.xyedges; _i < _a.length; _i++) {
        var edge = _a[_i];
        if (edge.selected) {
            if (selected) {
                selected = null;
                break;
            }
            selected = edge.data.id;
        }
    }
    return {
        viewId: c.view.id,
        selected: selected,
    };
}
exports.RelationshipPopover = (0, react_2.memo)(function () {
    var likec4model = (0, useLikeC4Model_1.useLikeC4Model)();
    var actorRef = (0, react_1.useActorRef)(actor_1.RelationshipPopoverActorLogic);
    var diagram = (0, useDiagram_1.useDiagram)();
    var _a = (0, useDiagram_1.useDiagramContext)(selectDiagramContext), viewId = _a.viewId, selected = _a.selected;
    var openedEdgeId = (0, react_1.useSelector)(actorRef, function (s) { return s.hasTag('opened') ? s.context.edgeId : null; });
    (0, useDiagram_1.useOnDiagramEvent)('navigateTo', function () {
        actorRef.send({ type: 'close' });
    });
    (0, useDiagram_1.useOnDiagramEvent)('edgeMouseEnter', function (_a) {
        var edge = _a.edge;
        actorRef.send({ type: 'xyedge.mouseEnter', edgeId: edge.data.id });
    });
    (0, useDiagram_1.useOnDiagramEvent)('edgeMouseLeave', function () {
        actorRef.send({ type: 'xyedge.mouseLeave' });
    });
    (0, useDiagram_1.useOnDiagramEvent)('walkthroughStarted', function () {
        actorRef.send({ type: 'close' });
    });
    (0, react_2.useEffect)(function () {
        if (selected) {
            actorRef.send({ type: 'xyedge.select', edgeId: selected });
        }
        else {
            actorRef.send({ type: 'xyedge.unselect' });
        }
    }, [selected]);
    var onMouseEnter = (0, react_2.useCallback)(function (event) {
        if (!openedEdgeId) {
            return;
        }
        actorRef.send({ type: 'dropdown.mouseEnter' });
        var edge = diagram.findEdge(openedEdgeId);
        if (edge && !edge.data.hovered) {
            diagram.send({ type: 'xyflow.edgeMouseEnter', edge: edge, event: event });
        }
    }, [actorRef, diagram, openedEdgeId]);
    var onMouseLeave = (0, react_2.useCallback)(function (event) {
        if (!openedEdgeId) {
            return;
        }
        actorRef.send({ type: 'dropdown.mouseLeave' });
        var edge = diagram.findEdge(openedEdgeId);
        if (edge === null || edge === void 0 ? void 0 : edge.data.hovered) {
            diagram.send({ type: 'xyflow.edgeMouseLeave', edge: edge, event: event });
        }
    }, [actorRef, diagram, openedEdgeId]);
    var _b = (0, useDiagram_1.useDiagramContext)(function (ctx) {
        var diagramEdge = openedEdgeId ? (0, utils_2.findDiagramEdge)(ctx, openedEdgeId) : null;
        var sourceNode = diagramEdge ? (0, utils_2.findDiagramNode)(ctx, diagramEdge.source) : null;
        var targetNode = diagramEdge ? (0, utils_2.findDiagramNode)(ctx, diagramEdge.target) : null;
        return ({
            diagramEdge: diagramEdge,
            sourceNode: sourceNode,
            targetNode: targetNode,
        });
    }, fast_equals_1.shallowEqual, [openedEdgeId]), diagramEdge = _b.diagramEdge, sourceNode = _b.sourceNode, targetNode = _b.targetNode;
    if (!diagramEdge || !sourceNode || !targetNode || (0, remeda_1.isEmpty)(diagramEdge.relations)) {
        return null;
    }
    var _c = (0, remeda_1.pipe)(diagramEdge.relations, (0, remeda_1.map)(function (id) {
        try {
            return likec4model.relationship(id);
        }
        catch (e) {
            // View was cached, but likec4model based on new data
            console.error("View is cached and likec4model missing relationship ".concat(id, " from ").concat(sourceNode.id, " -> ").concat(targetNode.id), e);
            return null;
        }
    }), (0, remeda_1.filter)(remeda_1.isTruthy), (0, remeda_1.partition)(function (r) { return r.source.id === sourceNode.id && r.target.id === targetNode.id; })), direct = _c[0], nested = _c[1];
    if (direct.length === 0 && nested.length === 0) {
        console.warn('No relationships found  diagram edge', {
            diagramEdge: diagramEdge,
            sourceNode: sourceNode,
            targetNode: targetNode,
        });
        return null;
    }
    return (<PortalToContainer_1.PortalToContainer>
      <RelationshipPopoverInternal viewId={viewId} direct={direct} nested={nested} diagramEdge={diagramEdge} sourceNode={sourceNode} targetNode={targetNode} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}/>
    </PortalToContainer_1.PortalToContainer>);
});
var getEdgeLabelElement = function (edgeId, container) {
    var _a, _b;
    return (_b = (_a = container === null || container === void 0 ? void 0 : container.querySelector(".likec4-edge-label[data-edge-id=\"".concat(edgeId, "\"]"))) !== null && _a !== void 0 ? _a : container === null || container === void 0 ? void 0 : container.querySelector(".likec4-edge-middle-point[data-edge-id=\"".concat(edgeId, "\"]"))) !== null && _b !== void 0 ? _b : null;
};
var POPOVER_PADDING = 8;
var RelationshipPopoverInternal = function (_a) {
    var _b;
    var viewId = _a.viewId, diagramEdge = _a.diagramEdge, direct = _a.direct, nested = _a.nested, sourceNode = _a.sourceNode, targetNode = _a.targetNode, onMouseEnter = _a.onMouseEnter, onMouseLeave = _a.onMouseLeave;
    var ref = (0, react_2.useRef)(null);
    var _c = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigateTo = _c.enableNavigateTo, enableVscode = _c.enableVscode;
    var onOpenSource = (0, DiagramEventHandlers_1.useDiagramEventHandlers)().onOpenSource;
    var containerRef = (0, context_1.useRootContainerRef)();
    var _d = (0, react_2.useState)(null), referenceEl = _d[0], setReferenceEl = _d[1];
    (0, react_2.useLayoutEffect)(function () {
        setReferenceEl(getEdgeLabelElement(diagramEdge.id, containerRef.current));
    }, [diagramEdge]);
    (0, react_2.useEffect)(function () {
        var reference = referenceEl;
        var popper = ref.current;
        if (!reference || !popper) {
            return;
        }
        var wasCanceled = false;
        var update = function () {
            void (0, dom_1.computePosition)(reference, popper, {
                placement: 'bottom-start',
                middleware: [
                    (0, dom_1.offset)(4),
                    (0, dom_1.autoPlacement)({
                        crossAxis: true,
                        // padding: POPOVER_PADDING,
                        allowedPlacements: [
                            'bottom-start',
                            'bottom-end',
                            'left-start',
                            'top-start',
                            'top-end',
                            'right-start',
                            'right-end',
                            'left-end',
                        ],
                    }),
                    (0, dom_1.size)({
                        apply: function (_a) {
                            var availableHeight = _a.availableHeight, availableWidth = _a.availableWidth, elements = _a.elements;
                            if (wasCanceled) {
                                return;
                            }
                            Object.assign(elements.floating.style, {
                                maxWidth: "".concat((0, remeda_1.clamp)((0, utils_1.roundDpr)(availableWidth), { min: 220, max: 400 }), "px"),
                                maxHeight: "".concat((0, remeda_1.clamp)((0, utils_1.roundDpr)(availableHeight), { min: 100, max: 500 }), "px"),
                            });
                        },
                    }),
                    (0, dom_1.hide)({
                        padding: POPOVER_PADDING * 2,
                    }),
                ],
            }).then(function (_a) {
                var _b;
                var x = _a.x, y = _a.y, middlewareData = _a.middlewareData;
                if (wasCanceled) {
                    return;
                }
                popper.style.transform = "translate(".concat((0, utils_1.roundDpr)(x), "px, ").concat((0, utils_1.roundDpr)(y), "px)");
                popper.style.visibility = ((_b = middlewareData.hide) === null || _b === void 0 ? void 0 : _b.referenceHidden) ? 'hidden' : 'visible';
            });
        };
        var cleanup = (0, dom_1.autoUpdate)(reference, popper, update, {
            ancestorResize: false,
            animationFrame: true,
        });
        return function () {
            wasCanceled = true;
            cleanup();
        };
    }, [referenceEl]);
    var diagram = (0, useDiagram_1.useDiagram)();
    var renderRelationship = (0, react_2.useCallback)(function (relationship, index) { return (<react_2.Fragment key={relationship.id}>
        {index > 0 && <core_2.Divider />}
        <Relationship viewId={viewId} relationship={relationship} sourceNode={sourceNode} targetNode={targetNode} onNavigateTo={enableNavigateTo
            ? function (viewId) {
                diagram.navigateTo(viewId);
            }
            : undefined} {...(onOpenSource && enableVscode && {
        onOpenSource: function () { return onOpenSource({ relation: relationship.id }); },
    })}/>
      </react_2.Fragment>); }, [viewId, sourceNode, targetNode, diagram, enableNavigateTo, onOpenSource, enableVscode]);
    return (<core_2.ScrollAreaAutosize ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} type="auto" scrollbars={'y'} scrollbarSize={6} styles={{
            viewport: {
                overscrollBehavior: 'contain',
                minWidth: 200,
                minHeight: 40,
            },
        }} className={(0, css_1.cx)((0, css_1.css)({
            layerStyle: 'likec4.dropdown',
            p: '0',
            pointerEvents: {
                base: 'all',
                _whenPanning: 'none',
            },
            position: 'absolute',
            top: '0',
            left: '0',
            width: 'max-content',
            cursor: 'default',
        }))}>
      <jsx_1.VStack css={{
            gap: '3',
            padding: '4',
            paddingTop: '2',
        }}>
        <core_2.Button variant="default" color="gray" size="compact-xs" style={_b = {
                alignSelf: 'flex-start',
                fontWeight: 'medium'
            },
            _b['--button-fz'] = 'var(--font-sizes-xxs)',
            _b} onClick={function (e) {
            e.stopPropagation();
            diagram.openRelationshipDetails(diagramEdge.id);
        }}>
          browse relationships
        </core_2.Button>
        {direct.length > 0 && (<>
            <Label>DIRECT RELATIONSHIPS</Label>
            {direct.map(renderRelationship)}
          </>)}
        {nested.length > 0 && (<>
            <Label css={{
                mt: direct.length > 0 ? '2' : '0',
            }}>
              RESOLVED FROM NESTED
            </Label>
            {nested.map(renderRelationship)}
          </>)}
      </jsx_1.VStack>
    </core_2.ScrollAreaAutosize>);
};
var EdgeDrifts = function (_a) {
    var diagramEdge = _a.diagramEdge;
    var drifts = diagramEdge.drifts;
    if (!drifts || drifts.length === 0) {
        return null;
    }
    return (<core_2.Notification color="orange" withBorder={false} withCloseButton={false} title="Changes:">
      {drifts.map(function (drift) { return (<jsx_1.Txt mt={'1'} size="xs" key={drift}>
          - {drift}
        </jsx_1.Txt>); })}
    </core_2.Notification>);
};
var Relationship = (0, react_2.forwardRef)(function (_a, ref) {
    var _b, _c;
    var viewId = _a.viewId, r = _a.relationship, sourceNode = _a.sourceNode, targetNode = _a.targetNode, onNavigateTo = _a.onNavigateTo, onOpenSource = _a.onOpenSource;
    var sourceId = getEndpointId(r, 'source', sourceNode);
    var targetId = getEndpointId(r, 'target', targetNode);
    var navigateTo = onNavigateTo && ((_b = r.navigateTo) === null || _b === void 0 ? void 0 : _b.id) !== viewId ? (_c = r.navigateTo) === null || _c === void 0 ? void 0 : _c.id : undefined;
    var links = r.links;
    // Build metadata tooltip content
    var metadataEntries = r.hasMetadata()
        ? (0, remeda_1.entries)(r.getMetadata()).sort(function (_a, _b) {
            var a = _a[0];
            var b = _b[0];
            return a.localeCompare(b);
        })
        : null;
    var metadataTooltipLabel = metadataEntries && (<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
            fontWeight: 'bold',
            fontSize: '10px',
            color: '#868e96',
            marginBottom: '2px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
        }}>
        Metadata
      </div>
      <div style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            paddingTop: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        }}>
        {metadataEntries.map(function (_a) {
            var key = _a[0], value = _a[1];
            var displayValue = Array.isArray(value) ? value.join(', ') : value;
            return (<div key={key} style={{ display: 'flex', gap: '12px', fontSize: '12px', lineHeight: '1.4' }}>
              <span style={{
                    fontWeight: 'bold',
                    minWidth: '110px',
                    color: '#495057',
                }}>
                {key}:
              </span>
              <span style={{
                    color: '#212529',
                    wordBreak: 'break-word',
                    flex: 1,
                }}>
                {displayValue}
              </span>
            </div>);
        })}
      </div>
    </div>);
    return (<jsx_1.VStack ref={ref} className={(0, patterns_1.bleed)({
            block: '2',
            inline: '2',
            paddingY: '2.5',
            paddingX: '2',
            gap: '1',
            rounded: 'sm',
            backgroundColor: {
                _hover: {
                    base: 'mantine.colors.gray[1]',
                    _dark: 'mantine.colors.dark[5]/70',
                },
            },
        })}>
      <jsx_1.HStack gap={'0.5'}>
        <core_2.TooltipGroup openDelay={200}>
          <Tooltip label={sourceId.full} offset={2} position="top-start">
            <components_1.Endpoint likec4color={sourceNode.color}>
              {sourceId.short}
            </components_1.Endpoint>
          </Tooltip>
          <icons_react_1.IconArrowRight stroke={2.5} size={'11px'} opacity={0.65}/>
          <Tooltip label={targetId.full} offset={2} position="top-start">
            <components_1.Endpoint likec4color={targetNode.color}>
              {targetId.short}
            </components_1.Endpoint>
          </Tooltip>
          {navigateTo && (<Tooltip label={'Open dynamic view'}>
              <core_2.ActionIcon size={'sm'} radius="sm" variant="default" onClick={function (event) {
                event.stopPropagation();
                onNavigateTo === null || onNavigateTo === void 0 ? void 0 : onNavigateTo(navigateTo);
            }} style={{
                alignSelf: 'flex-end',
            }} role="button">
                <icons_react_1.IconZoomScan size="80%" stroke={2}/>
              </core_2.ActionIcon>
            </Tooltip>)}
          {onOpenSource && (<Tooltip label={'Open source'}>
              <core_2.ActionIcon size={'sm'} radius="sm" variant="default" onClick={function (event) {
                event.stopPropagation();
                onOpenSource();
            }} role="button">
                <icons_react_1.IconFileSymlink size="80%" stroke={2}/>
              </core_2.ActionIcon>
            </Tooltip>)}
        </core_2.TooltipGroup>
      </jsx_1.HStack>
      <jsx_1.HStack gap={'xs'} alignItems="center">
        <components_1.RelationshipTitle>{r.title || 'untitled'}</components_1.RelationshipTitle>
        {metadataTooltipLabel && (<Tooltip label={metadataTooltipLabel} w={350} position="right" offset={10} openDelay={300} withArrow bg="white" c="dark" withinPortal styles={{
                tooltip: {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #dee2e6',
                },
            }}>
            <jsx_1.Box display="inline-flex">
              <icons_react_1.IconInfoCircle size={14} opacity={0.5} style={{ flexShrink: 0, cursor: 'help' }}/>
            </jsx_1.Box>
          </Tooltip>)}
      </jsx_1.HStack>
      {r.kind && (<jsx_1.HStack gap="2">
          <Label>kind</Label>
          <core_2.Text size="xs" className={(0, css_1.css)({ userSelect: 'all' })}>{r.kind}</core_2.Text>
        </jsx_1.HStack>)}
      {r.technology && (<jsx_1.HStack gap="2">
          <Label>technology</Label>
          <core_2.Text size="xs" className={(0, css_1.css)({ userSelect: 'all' })}>{r.technology}</core_2.Text>
        </jsx_1.HStack>)}
      {r.summary.nonEmpty && (<>
          <Label>description</Label>
          <jsx_1.Box css={{
                paddingLeft: '2.5',
                py: '1.5',
                borderLeft: '2px dotted',
                borderLeftColor: {
                    base: 'mantine.colors.gray[3]',
                    _dark: 'mantine.colors.dark[4]',
                },
            }}>
            <base_primitives_1.Markdown value={r.summary} fontSize={'sm'} textScale={0.875}/>
          </jsx_1.Box>
        </>)}
      {links.length > 0 && (<>
          <Label>links</Label>
          <jsx_1.HStack gap="1" flexWrap={'wrap'}>
            {links.map(function (link) { return <Link_1.Link key={link.url} size="sm" value={link}/>; })}
          </jsx_1.HStack>
        </>)}
    </jsx_1.VStack>);
});
var Label = (0, jsx_1.styled)('div', {
    base: {
        display: 'block',
        fontSize: 'xxs',
        fontWeight: 'medium',
        userSelect: 'none',
        lineHeight: 'sm',
        color: 'text.dimmed',
    },
});
var Tooltip = core_2.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    label: '',
    children: null,
    offset: 8,
    withinPortal: false,
});
function getEndpointId(r, endpoint, diagramNode) {
    var diagramNodeId = r.isDeploymentRelation()
        // Relation defined in deployment model. Use id of the deployment node as is.
        ? diagramNode.id
        // Relation defined in model. Get id of the model element
        : diagramNode.modelRef || '';
    var full = r[endpoint].id;
    var short = (0, core_1.nameFromFqn)(diagramNodeId) + full.slice(diagramNodeId.length);
    return { full: full, short: short };
}
