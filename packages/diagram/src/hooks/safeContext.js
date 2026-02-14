"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagramApiContextProvider = exports.DiagramActorContextProvider = void 0;
exports.useDiagramActorRef = useDiagramActorRef;
exports.useDiagram = useDiagram;
var react_1 = require("react");
/**
 * To improve experience with HMR, we move context to separate files and use as a boundary for hoooks
 */
var DiagramActorSafeContext = (0, react_1.createContext)(null);
DiagramActorSafeContext.displayName = 'DiagramActorSafeContext';
var DiagramApiSafeContext = (0, react_1.createContext)(null);
DiagramApiSafeContext.displayName = 'DiagramApiSafeContext';
exports.DiagramActorContextProvider = DiagramActorSafeContext.Provider;
exports.DiagramApiContextProvider = DiagramApiSafeContext.Provider;
function useDiagramActorRef() {
    var ctx = (0, react_1.useContext)(DiagramActorSafeContext);
    if (ctx === null) {
        throw new Error('DiagramActorRef is not provided');
    }
    return ctx;
}
function useDiagram() {
    var ctx = (0, react_1.useContext)(DiagramApiSafeContext);
    if (ctx === null) {
        throw new Error('DiagramApi is not provided');
    }
    return ctx;
}
