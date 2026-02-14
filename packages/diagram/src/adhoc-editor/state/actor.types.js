"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.machine = void 0;
exports.ruleToPredicate = ruleToPredicate;
exports.createContext = createContext;
var xstate_1 = require("xstate");
function ruleToPredicate(rule) {
    return rule.type === 'include' ? { include: [rule.expr] } : { exclude: [rule.expr] };
}
exports.machine = (0, xstate_1.setup)({
    types: {
        context: {},
        tags: '',
        // input: {} as Input,
        events: {},
        emitted: {},
    },
    actors: {
        service: {},
    },
    guards: {
        hasView: function (_a) {
            var context = _a.context;
            return context.view !== null;
        },
    },
});
function createContext() {
    return {
        view: null,
        error: undefined,
        rules: [],
    };
}
