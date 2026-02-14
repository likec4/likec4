"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditorActorLogic = useEditorActorLogic;
var react_1 = require("react");
var xstate_1 = require("xstate");
var hooks_1 = require("../hooks");
var applyChangesToManualLayout_1 = require("./applyChangesToManualLayout");
var editorActor_states_1 = require("./editorActor.states");
var LikeC4EditorProvider_1 = require("./LikeC4EditorProvider");
var promisify = function (fn) {
    return Promise.resolve().then(function () { return fn(); });
};
function useEditorActorLogic() {
    var _this = this;
    var port = (0, LikeC4EditorProvider_1.useOptionalLikeC4Editor)();
    var applyLatest = (0, hooks_1.useCallbackRef)(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var manual, latest, updated;
        var _c = _b.input, viewId = _c.viewId, current = _c.current;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!port) {
                        console.error('No editor port available for applying latest to manual layout');
                        return [2 /*return*/, Promise.reject(new Error('No editor port'))];
                    }
                    return [4 /*yield*/, promisify(function () { return current !== null && current !== void 0 ? current : port.fetchView(viewId, 'manual'); })];
                case 1:
                    manual = _d.sent();
                    return [4 /*yield*/, promisify(function () { return port.fetchView(viewId, 'auto'); })];
                case 2:
                    latest = _d.sent();
                    updated = (0, applyChangesToManualLayout_1.applyChangesToManualLayout)(manual, latest);
                    return [2 /*return*/, {
                            updated: updated,
                        }];
            }
        });
    }); });
    var executeChange = (0, hooks_1.useCallbackRef)(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var _loop_1, _i, _c, change;
        var input = _b.input;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!port) {
                        console.error('No editor port available for executing change');
                        return [2 /*return*/, Promise.reject(new Error('No editor port'))];
                    }
                    if (import.meta.env.DEV) {
                        console.debug('Executing change', { input: input });
                    }
                    _loop_1 = function (change) {
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0: return [4 /*yield*/, promisify(function () { return port.handleChange(input.viewId, change); })];
                                case 1:
                                    _e.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _c = input.changes;
                    _d.label = 1;
                case 1:
                    if (!(_i < _c.length)) return [3 /*break*/, 4];
                    change = _c[_i];
                    return [5 /*yield**/, _loop_1(change)];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, {}];
            }
        });
    }); });
    return (0, react_1.useMemo)(function () {
        return editorActor_states_1.editorActorLogic.provide({
            actors: {
                applyLatest: (0, xstate_1.fromPromise)(applyLatest),
                executeChange: (0, xstate_1.fromPromise)(executeChange),
            },
        });
    }, [applyLatest, executeChange]);
}
