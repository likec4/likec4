"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useElementDetailsActorRef = exports.ElementDetailsActorContext = void 0;
var react_1 = require("react");
/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
 */
exports.ElementDetailsActorContext = (0, react_1.createContext)(null);
exports.ElementDetailsActorContext.displayName = 'ElementDetailsActorContext';
var useElementDetailsActorRef = function () {
    var ctx = (0, react_1.useContext)(exports.ElementDetailsActorContext);
    if (ctx === null) {
        throw new Error('ElementDetailsActorRef is not provided');
    }
    return ctx;
};
exports.useElementDetailsActorRef = useElementDetailsActorRef;
