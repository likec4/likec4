"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdhocEditorActorProvider = AdhocEditorActorProvider;
var react_1 = require("@xstate/react");
var react_2 = require("react");
var xstate_1 = require("xstate");
var hooks_1 = require("../hooks");
var actor_1 = require("./actor");
var State = {
    read: function () { var _a; return (_a = JSON.parse(sessionStorage.getItem('adhoc-editor-state') || 'null')) !== null && _a !== void 0 ? _a : undefined; },
    write: function (state) { return sessionStorage.setItem('adhoc-editor-state', JSON.stringify(state)); },
};
function AdhocEditorActorProvider(_a) {
    var children = _a.children, service = _a.service;
    var serviceRef = (0, react_2.useRef)(service);
    serviceRef.current = service;
    var provided = (0, react_2.useMemo)(function () { return ({
        actors: {
            service: (0, xstate_1.fromPromise)(function (_a) {
                var input = _a.input;
                return serviceRef.current.process(input);
            }),
        },
    }); }, []);
    var actorRef = (0, react_1.useActorRef)(actor_1.adhocEditorLogic.provide(provided), {
        id: 'adhoc-editor',
        snapshot: State.read(),
        systemId: 'adhoc-editor',
        inspect: function (event) {
            console.log('[AdhocEditorActor]', event);
        },
    });
    (0, react_2.useEffect)(function () {
        var subscription = actorRef.subscribe(function (state) {
            State.write(state);
        });
        return function () { return subscription.unsubscribe(); };
    }, [actorRef]);
    return (<hooks_1.AdhocEditorActorContextProvider value={actorRef}>
      {children}
    </hooks_1.AdhocEditorActorContextProvider>);
}
