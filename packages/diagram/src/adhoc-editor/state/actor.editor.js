"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editor = void 0;
var core_1 = require("@likec4/core");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var actor_layouter_1 = require("./actor.layouter");
var actor_types_1 = require("./actor.types");
var to = {
    idle: { target: '#idle' },
    selecting: { target: '#selecting' },
    layouting: { target: '#layouting' },
};
function nextId(_a, salt) {
    var _b, _c;
    var rules = _a.rules;
    if (salt === void 0) { salt = ''; }
    return (0, utils_1.stringHash)(((_c = (_b = rules.at(-1)) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : new Date().toISOString()) + salt);
}
var isRef = function (fqn) { return function (exp) {
    return core_1.ModelFqnExpr.isModelRef(exp) && exp.ref.model === fqn;
}; };
var isRuleOf = function (fqn) { return function (rule) {
    return core_1.ModelFqnExpr.isModelRef(rule.expr) && rule.expr.ref.model === fqn;
}; };
var isIncludeOf = function (fqn) { return function (rule) {
    return rule.type === 'include' && core_1.ModelFqnExpr.isModelRef(rule.expr) && rule.expr.ref.model === fqn;
}; };
var isExcludeOf = function (fqn) { return function (rule) {
    return rule.type === 'exclude' && core_1.ModelFqnExpr.isModelRef(rule.expr) && rule.expr.ref.model === fqn;
}; };
function deriveElementState(id, _a) {
    var rules = _a.rules, view = _a.view;
    var ruleOf = rules.find(isRuleOf(id));
    if (ruleOf && !ruleOf.enabled) {
        return {
            state: 'disabled',
            ruleId: ruleOf.id,
        };
    }
    var isIncludedInView = view ? view.nodes.some(function (node) { return node.modelRef === id; }) : false;
    var includeRule = rules.find(isIncludeOf(id));
    var excludeRule = rules.find(isExcludeOf(id));
    switch (true) {
        case includeRule && isIncludedInView:
            return {
                state: 'include-explicit',
                ruleId: includeRule.id,
            };
        case !includeRule && isIncludedInView:
            return {
                state: 'include-implicit',
                ruleId: undefined,
            };
        case includeRule && !isIncludedInView:
            return {
                state: 'not-present',
                ruleId: includeRule.id,
            };
        case !!excludeRule:
            return {
                state: 'exclude',
                ruleId: excludeRule.id,
            };
        default: {
            (0, utils_1.invariant)(isIncludedInView === false, 'Element not in view should not be included or excluded by any rule');
            return {
                state: 'not-present',
                ruleId: undefined,
            };
        }
    }
}
var enableRule = function (ruleId) {
    return actor_types_1.machine.assign(function (_a) {
        var context = _a.context;
        return {
            rules: context.rules.map(function (rule) {
                if (rule.id === ruleId && !rule.enabled) {
                    return __assign(__assign({}, rule), { enabled: true });
                }
                return rule;
            }),
        };
    });
};
var addElementRules = function (fqn, type) {
    return actor_types_1.machine.assign(function (_a) {
        // const isRuleOfTheElement = isRuleOf(fqn)
        // // Remove any existing rules of the element
        // const rules = [...context.rules]
        var context = _a.context;
        // rules.push({
        //   id: nextId(context, type + fqn),
        //   expr: { ref: { model: fqn } },
        //   enabled: true,
        //   type,
        // })
        return {
            rules: __spreadArray(__spreadArray([], context.rules, true), [
                {
                    id: nextId(context, type + fqn),
                    expr: { ref: { model: fqn } },
                    enabled: true,
                    type: type,
                },
            ], false),
        };
    });
};
var removeElementRules = function (fqn) {
    return actor_types_1.machine.assign(function (_a) {
        var context = _a.context;
        var isRule = isRuleOf(fqn);
        return {
            rules: context.rules.filter(function (rule) {
                return !isRule(rule);
            }),
        };
    });
};
var toggleElement = function () {
    return actor_types_1.machine.enqueueActions(function (_a) {
        var context = _a.context, event = _a.event, enqueue = _a.enqueue;
        (0, xstate_1.assertEvent)(event, 'toggle.element');
        var isRuleOfTheElement = isRuleOf(event.id);
        var lastRule = (0, remeda_1.last)(context.rules);
        // If the last rule is about the element,
        // We can just toggle it without searching for the element rules in the list
        if (lastRule && isRuleOfTheElement(lastRule)) {
            enqueue.assign({
                rules: context.rules.slice(0, -1),
            });
            return;
        }
        var state = deriveElementState(event.id, context);
        switch (state.state) {
            case 'disabled': {
                enqueue(enableRule(state.ruleId));
                break;
            }
            // Include element if it is not in view and not included/excluded by any rule
            case 'not-present': {
                enqueue(removeElementRules(event.id));
                // If the element has an explicit rule, but was not included in the view
                // lets re-add at the end of the rules list to make it effective again
                enqueue(addElementRules(event.id, 'include'));
                break;
            }
            case 'include-implicit': {
                enqueue(removeElementRules(event.id));
                enqueue(addElementRules(event.id, 'exclude'));
                break;
            }
            case 'include-explicit':
            case 'exclude': {
                enqueue(removeElementRules(event.id));
                break;
            }
            default:
                (0, utils_1.nonexhaustive)(state);
        }
    });
};
// Extracted actions
// const includePredicate = () =>
//   machine.assign(({ context, event }) => {
//     const id = stringHash((context.rules.at(-1)?.id ?? new Date().toISOString()) + event.type)
//     switch (event.type) {
//       case 'include.element': {
//         return {
//           rules: [
//             ...context.rules,
//             {
//               id,
//               expr: { ref: { model: event.model } },
//               enabled: true,
//               type: 'include',
//             },
//           ],
//         }
//       }
//       default: {
//         throw new Error(`Unexpected event ${event.type}}`)
//       }
//     }
//   })
var toggleRule = function () {
    return actor_types_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'toggle.rule');
        return {
            rules: context.rules.map(function (rule) {
                if (rule.id === event.ruleId) {
                    return __assign(__assign({}, rule), { enabled: !rule.enabled });
                }
                return rule;
            }),
        };
    });
};
var deleteRule = function () {
    return actor_types_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'delete.rule');
        return {
            rules: context.rules.filter(function (rule) { return rule.id !== event.ruleId; }),
        };
    });
};
var scheduleLayout = function () { return actor_types_1.machine.raise({ type: 'layout' }); };
var idle = actor_types_1.machine.createStateConfig({
    id: 'idle',
    on: {
        'select.open': __assign({}, to.selecting),
        'toggle.rule': __assign({ actions: toggleRule() }, to.layouting),
        'delete.rule': __assign({ actions: deleteRule() }, to.layouting),
    },
});
var selecting = actor_types_1.machine.createStateConfig({
    id: 'selecting',
    on: {
        'toggle.element': {
            actions: [
                toggleElement(),
                (0, actor_layouter_1.emitViewUpdate)(),
                scheduleLayout(),
            ],
            // ...to.layouting,
        },
        'select.close': __assign({}, to.idle),
    },
});
var layouting = actor_types_1.machine.createStateConfig({
    id: 'layouting',
    always: __assign({ actions: scheduleLayout() }, to.idle),
});
exports.editor = actor_types_1.machine.createStateConfig({
    initial: 'selecting',
    states: {
        idle: idle,
        selecting: selecting,
        layouting: layouting,
    },
});
