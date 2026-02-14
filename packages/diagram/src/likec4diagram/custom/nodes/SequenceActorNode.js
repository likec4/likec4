"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceActorNode = SequenceActorNode;
exports.SequenceParallelArea = SequenceParallelArea;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var react_1 = require("@xyflow/react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var ElementActions_1 = require("./ElementActions");
var NodeDrifts_1 = require("./NodeDrifts");
var NodeNotes_1 = require("./NodeNotes");
var nodes_1 = require("./nodes");
var ElementToolbar_1 = require("./toolbar/ElementToolbar");
var positionMap = {
    left: react_1.Position.Left,
    right: react_1.Position.Right,
    top: react_1.Position.Top,
    bottom: react_1.Position.Bottom,
};
var ActorStepPort = function (_a) {
    var data = _a.data, p = _a.port;
    return (<>
      <jsx_1.Box data-likec4-color={data.color} className={(0, css_1.css)({
            position: 'absolute',
            backgroundColor: 'var(--likec4-palette-fill)',
            rounded: 'xs',
            width: {
                base: '5px',
                _whenHovered: '7px',
                _whenSelected: '7px',
            },
            transition: 'fast',
            translateX: '-1/2',
            translateY: '-1/2',
            translate: 'auto',
        })} style={{
            top: p.cy,
            left: p.cx,
            height: p.height,
        }}/>
      <react_1.Handle id={p.id} type={p.type} position={positionMap[p.position]} style={{
            top: p.cy - 3,
            left: p.cx - 3,
            width: 6,
            height: 6,
            right: 'unset',
            bottom: 'unset',
            visibility: 'hidden',
            transform: p.position === 'left' ? 'translate(-150%, 0)' : 'translate(100%, 0)',
        }}/>
    </>);
};
var hasModelFqn = function (node) {
    return 'modelFqn' in node.data && (0, remeda_1.isTruthy)(node.data.modelFqn);
};
function SequenceActorNode(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableElementDetails = _a.enableElementDetails, enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest, enableNotes = _a.enableNotes;
    var data = props.data;
    var id = props.id, positionAbsoluteY = props.positionAbsoluteY, _b = props.data, viewHeight = _b.viewHeight, _c = _b.hovered, isHovered = _c === void 0 ? false : _c, ports = _b.ports;
    return (<>
      <jsx_1.Box data-likec4-color={'gray'} className={(0, css_1.css)({
            position: 'absolute',
            rounded: 'xs',
            top: '1',
            pointerEvents: 'none',
            transition: 'fast',
            translateX: '-1/2',
            translate: 'auto',
        })} style={{
            backgroundColor: 'var(--likec4-palette-stroke)',
            opacity: isHovered ? 0.6 : 0.4,
            left: '50%',
            width: isHovered ? 3 : 2,
            height: viewHeight - positionAbsoluteY,
            zIndex: -1,
            pointerEvents: 'none',
        }}/>
      <base_primitives_1.ElementNodeContainer nodeProps={props}>
        {enableCompareWithLatest && <NodeDrifts_1.NodeDrifts nodeProps={props}/>}
        <base_primitives_1.ElementShape {...props}/>
        <base_primitives_1.ElementData {...props}/>
        {hasModelFqn(props) && (<>
            <ElementActions_1.ElementActions {...props}/>
            {enableElementDetails && <nodes_1.ElementDetailsButtonWithHandler id={id} data={data}/>}
            {!enableReadOnly && <ElementToolbar_1.ElementToolbar {...props}/>}
          </>)}
        {enableNotes && <NodeNotes_1.NodeNotes {...props}/>}
      </base_primitives_1.ElementNodeContainer>
      {ports.map(function (p) { return <ActorStepPort key={p.id} port={p} data={props.data}/>; })}
    </>);
}
function SequenceParallelArea(props) {
    return (<jsx_1.Box data-likec4-color={props.data.color} css={{
            width: '100%',
            height: '100%',
            border: 'default',
            rounded: 'sm',
            borderWidth: 1,
            '--_color': {
                base: 'var(--likec4-palette-stroke)',
                _dark: '[color-mix(in oklab, var(--likec4-palette-hiContrast) 40%, var(--likec4-palette-fill))]',
            },
            borderColor: '[var(--_color)/30]',
            backgroundColor: 'var(--likec4-palette-fill)/15',
            pointerEvents: 'none',
            paddingLeft: '2',
            paddingTop: '0.5',
            fontSize: 'xs',
            fontWeight: 'bold',
            letterSpacing: '.75px',
            color: '[var(--_color)/75]',
        }}>
      PARALLEL
    </jsx_1.Box>);
}
