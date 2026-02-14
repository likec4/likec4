"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaPrintActorLogic = void 0;
var xstate_1 = require("xstate");
/**
 * Actor logic to listen for media print events.
 */
exports.mediaPrintActorLogic = (0, xstate_1.fromCallback)(function (_a) {
    var sendBack = _a.sendBack;
    var beforePrint = function () {
        sendBack({ type: 'media.print.on' });
    };
    var afterPrint = function () {
        sendBack({ type: 'media.print.off' });
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return function () {
        window.removeEventListener('beforeprint', beforePrint);
        window.removeEventListener('afterprint', afterPrint);
    };
});
