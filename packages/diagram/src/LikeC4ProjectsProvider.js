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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4ProjectsProvider = LikeC4ProjectsProvider;
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
var LikeC4ProjectsContext_1 = require("./context/LikeC4ProjectsContext");
var useCallbackRef_1 = require("./hooks/useCallbackRef");
/**
 * Ensures LikeC4Projects context
 */
function LikeC4ProjectsProvider(_a) {
    var children = _a.children, projects = _a.projects, _onProjectChange = _a.onProjectChange;
    var outerScope = (0, LikeC4ProjectsContext_1.useOptionalProjectsContext)();
    (0, react_1.useEffect)(function () {
        if (outerScope) {
            console.warn('LikeC4ProjectsProvider should not be nested inside another one');
        }
    }, []);
    var onProjectChange = (0, useCallbackRef_1.useCallbackRef)(_onProjectChange);
    var _b = (0, react_1.useState)(function () { return ({ projects: projects, onProjectChange: onProjectChange }); }), value = _b[0], setValue = _b[1];
    (0, react_1.useEffect)(function () {
        setValue(function (current) {
            return (0, fast_equals_1.deepEqual)(current.projects, projects) ? current : __assign(__assign({}, current), { projects: projects });
        });
    }, [projects]);
    return (<LikeC4ProjectsContext_1.LikeC4ProjectsContextProvider value={value}>
      {children}
    </LikeC4ProjectsContext_1.LikeC4ProjectsContextProvider>);
}
