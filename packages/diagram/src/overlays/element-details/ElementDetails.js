"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementDetails = ElementDetails;
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var actorContext_1 = require("./actorContext");
var ElementDetailsCard_1 = require("./ElementDetailsCard");
var selector = function (s) { return ({
    viewId: s.context.currentView.id,
    fromNode: s.context.initiatedFrom.node,
    rectFromNode: s.context.initiatedFrom.clientRect,
    fqn: s.context.subject,
}); };
function ElementDetails(_a) {
    var actorRef = _a.actorRef, onClose = _a.onClose;
    var props = (0, react_1.useSelector)(actorRef, selector, fast_equals_1.shallowEqual);
    return (<actorContext_1.ElementDetailsActorContext.Provider value={actorRef}>
      <ElementDetailsCard_1.ElementDetailsCard onClose={onClose} {...props}/>
    </actorContext_1.ElementDetailsActorContext.Provider>);
}
