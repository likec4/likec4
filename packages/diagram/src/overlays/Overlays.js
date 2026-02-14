"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Overlays = Overlays;
var core_1 = require("@likec4/core");
var react_1 = require("@xstate/react");
var motion_1 = require("motion");
var react_2 = require("motion/react");
var react_3 = require("react");
var remeda_1 = require("remeda");
var ErrorFallback_1 = require("../components/ErrorFallback");
var context_1 = require("../context");
var hooks_1 = require("../hooks");
var ElementDetails_1 = require("./element-details/ElementDetails");
var Overlay_1 = require("./overlay/Overlay");
var RelationshipDetails_1 = require("./relationship-details/RelationshipDetails");
var RelationshipsBrowser_1 = require("./relationships-browser/RelationshipsBrowser");
var selectOverlays = function (s) {
    return s.context.overlays.map(function (overlay) {
        switch (overlay.type) {
            case 'relationshipsBrowser':
                return s.children[overlay.id]
                    ? {
                        type: overlay.type,
                        actorRef: s.children[overlay.id],
                    }
                    : null;
            case 'relationshipDetails':
                return s.children[overlay.id]
                    ? {
                        type: overlay.type,
                        actorRef: s.children[overlay.id],
                    }
                    : null;
            case 'elementDetails':
                return s.children[overlay.id]
                    ? {
                        type: overlay.type,
                        actorRef: s.children[overlay.id],
                    }
                    : null;
            default:
                (0, core_1.nonexhaustive)(overlay);
        }
    }).filter(remeda_1.isNonNullish);
};
var compareSelectOverlays = function (a, b) {
    return a.length === b.length && a.every(function (overlay, i) {
        return overlay.actorRef === b[i].actorRef;
    });
};
function Overlays(_a) {
    var _b;
    var overlaysActorRef = _a.overlaysActorRef;
    var diagram = (0, hooks_1.useDiagram)();
    var overlays = (0, react_1.useSelector)(overlaysActorRef, selectOverlays, compareSelectOverlays);
    var isMotionReduced = (_b = (0, react_2.useReducedMotionConfig)()) !== null && _b !== void 0 ? _b : false;
    var isActiveOverlay = overlays.some(function (overlay) { return overlay.type === 'elementDetails'; });
    (0, react_3.useEffect)(function () {
        var xyflowDomNode = diagram.getContext().xystore.getState().domNode;
        var xyflowRendererDom = xyflowDomNode === null || xyflowDomNode === void 0 ? void 0 : xyflowDomNode.querySelector('.react-flow__renderer');
        if (!xyflowRendererDom || isMotionReduced)
            return;
        var current = (0, motion_1.animate)(xyflowRendererDom, {
            opacity: isActiveOverlay ? 0.7 : 1,
            filter: isActiveOverlay ? 'grayscale(1)' : 'grayscale(0)',
            transform: isActiveOverlay ? "perspective(400px) translateZ(-12px) translateY(3px)" : "translateY(0)",
        }, {
            duration: isActiveOverlay ? 0.35 : 0.17,
        });
        var cleanupTm = null;
        if (!isActiveOverlay) {
            // Remove styles after animation when closing overlay
            // This improves performance by reducing number of layers being rendered
            cleanupTm = setTimeout(function () {
                xyflowRendererDom.style.transform = '';
                xyflowRendererDom.style.filter = '';
                cleanupTm = null;
            }, 450);
        }
        return function () {
            if (cleanupTm) {
                clearTimeout(cleanupTm);
            }
            current.stop();
        };
    }, [isActiveOverlay]);
    var close = function (actorRef) {
        overlaysActorRef.send({ type: 'close', actorId: actorRef.id });
    };
    var overlaysReact = overlays.map(function (overlay, index) {
        switch (overlay.type) {
            case 'relationshipsBrowser':
                return (<Overlay_1.Overlay key={overlay.actorRef.sessionId} overlayLevel={index} onClose={function () { return close(overlay.actorRef); }}>
            <RelationshipsBrowser_1.RelationshipsBrowser actorRef={overlay.actorRef}/>
          </Overlay_1.Overlay>);
            case 'relationshipDetails':
                return (<Overlay_1.Overlay overlayLevel={index} key={overlay.actorRef.sessionId} onClose={function () { return close(overlay.actorRef); }}>
            <RelationshipDetails_1.RelationshipDetails actorRef={overlay.actorRef}/>
          </Overlay_1.Overlay>);
            case 'elementDetails':
                return (<ElementDetails_1.ElementDetails key={overlay.actorRef.sessionId} actorRef={overlay.actorRef} onClose={function () { return close(overlay.actorRef); }}/>);
            default:
                (0, core_1.nonexhaustive)(overlay);
        }
    });
    return (<context_1.DiagramFeatures.Overlays>
      <ErrorFallback_1.ErrorBoundary onReset={function () { return overlaysActorRef.send({ type: 'close.all' }); }}>
        <react_2.LayoutGroup>
          <react_2.AnimatePresence mode="popLayout">
            {overlaysReact}
          </react_2.AnimatePresence>
        </react_2.LayoutGroup>
      </ErrorFallback_1.ErrorBoundary>
    </context_1.DiagramFeatures.Overlays>);
}
