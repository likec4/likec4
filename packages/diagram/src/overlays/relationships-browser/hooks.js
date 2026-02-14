"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipsBrowserActorContext = void 0;
exports.useRelationshipsBrowserActor = useRelationshipsBrowserActor;
exports.useRelationshipsBrowserState = useRelationshipsBrowserState;
exports.useRelationshipsBrowser = useRelationshipsBrowser;
var core_1 = require("@likec4/core");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
exports.RelationshipsBrowserActorContext = (0, react_2.createContext)(null);
function useRelationshipsBrowserActor() {
    return (0, core_1.nonNullable)((0, react_2.useContext)(exports.RelationshipsBrowserActorContext), 'No RelationshipsBrowserActorContext');
}
function useRelationshipsBrowserState(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    var actor = useRelationshipsBrowserActor();
    return (0, react_1.useSelector)(actor, selector, compare);
}
function useRelationshipsBrowser() {
    var actor = useRelationshipsBrowserActor();
    return (0, react_2.useMemo)(function () { return ({
        actor: actor,
        get rootElementId() {
            return "relationships-browser-".concat(actor.sessionId.replaceAll(':', '_'));
        },
        getState: function () { return actor.getSnapshot().context; },
        send: actor.send,
        updateView: function (layouted) {
            if (actor.getSnapshot().status === 'active') {
                actor.send({
                    type: 'update.view',
                    layouted: layouted,
                });
            }
        },
        changeScope: function (scope) {
            actor.send({
                type: 'change.scope',
                scope: scope,
            });
        },
        navigateTo: function (subject, fromNode) {
            actor.send({
                type: 'navigate.to',
                subject: subject,
                fromNode: fromNode,
            });
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
