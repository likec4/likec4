"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotkeyActorLogic = void 0;
var hooks_1 = require("@mantine/hooks");
var xstate_1 = require("xstate");
exports.hotkeyActorLogic = (0, xstate_1.fromCallback)(function (_a) {
    var sendBack = _a.sendBack;
    var ctrlZHandler = (0, hooks_1.getHotkeyHandler)([
        ['mod + z', function (event) {
                event.stopPropagation();
                sendBack({ type: 'undo' });
            }, {
                preventDefault: true,
            }],
    ]);
    document.body.addEventListener('keydown', ctrlZHandler, { capture: true });
    return function () {
        document.body.removeEventListener('keydown', ctrlZHandler, { capture: true });
    };
});
