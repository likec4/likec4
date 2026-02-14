"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipDetailsActorContext = void 0;
exports.useRelationshipDetailsActor = useRelationshipDetailsActor;
exports.useRelationshipDetailsState = useRelationshipDetailsState;
exports.useRelationshipDetails = useRelationshipDetails;
var core_1 = require("@likec4/core");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var useCallbackRef_1 = require("../../hooks/useCallbackRef");
exports.RelationshipDetailsActorContext = (0, react_2.createContext)(null);
function useRelationshipDetailsActor() {
    return (0, core_1.nonNullable)((0, react_2.useContext)(exports.RelationshipDetailsActorContext), 'No RelationshipDetailsActorContext');
}
function useRelationshipDetailsState(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    var select = (0, useCallbackRef_1.useCallbackRef)(selector);
    var actor = useRelationshipDetailsActor();
    return (0, react_1.useSelector)(actor, select, compare);
}
function useRelationshipDetails() {
    var actor = useRelationshipDetailsActor();
    return (0, react_2.useMemo)(function () { return ({
        actor: actor,
        get rootElementId() {
            return "relationship-details-".concat(actor.sessionId.replaceAll(':', '_'));
        },
        getState: function () { return actor.getSnapshot().context; },
        send: actor.send,
        navigateTo: function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            if (params.length === 1) {
                actor.send({ type: 'navigate.to', params: { edgeId: params[0] } });
            }
            else {
                actor.send({ type: 'navigate.to', params: { source: params[0], target: params[1] } });
            }
        },
        fitDiagram: function () {
            actor.send({ type: 'fitDiagram' });
        },
        close: function () {
            var _a;
            if (actor._parent) {
                ;
                (_a = actor._parent) === null || _a === void 0 ? void 0 : _a.send({ type: 'close', actorId: actor.id });
            }
            else {
                actor.send({ type: 'close' });
            }
        },
    }); }, [actor]);
}
