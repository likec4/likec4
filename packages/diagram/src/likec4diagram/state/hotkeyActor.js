"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotkeyActorLogic = void 0;
var hooks_1 = require("@mantine/hooks");
var xstate_1 = require("xstate");
exports.hotkeyActorLogic = (0, xstate_1.fromCallback)(function (_a) {
    var sendBack = _a.sendBack;
    var escHandler = (0, hooks_1.getHotkeyHandler)([
        ['Escape', function (event) {
                event.stopPropagation();
                sendBack({ type: 'key.esc' });
            }, {
                preventDefault: true,
            }],
    ]);
    var arrowshandler = (0, hooks_1.getHotkeyHandler)([
        ['ArrowLeft', function (event) {
                event.stopPropagation();
                sendBack({ type: 'key.arrow.left' });
            }, {
                preventDefault: true,
            }],
        ['ArrowUp', function (event) {
                event.stopPropagation();
                sendBack({ type: 'key.arrow.up' });
            }, {
                preventDefault: true,
            }],
        ['ArrowRight', function (event) {
                event.stopPropagation();
                sendBack({ type: 'key.arrow.right' });
            }, {
                preventDefault: true,
            }],
        ['ArrowDown', function (event) {
                event.stopPropagation();
                sendBack({ type: 'key.arrow.down' });
            }, {
                preventDefault: true,
            }],
    ]);
    document.body.addEventListener('keydown', escHandler);
    document.body.addEventListener('keydown', arrowshandler, { capture: true });
    return function () {
        document.body.removeEventListener('keydown', escHandler);
        document.body.removeEventListener('keydown', arrowshandler, { capture: true });
    };
});
