"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchActorRef = useSearchActorRef;
var useDiagram_1 = require("./useDiagram");
var select = (0, useDiagram_1.selectDiagramActor)(function (s) {
    var _a;
    return (_a = s.children.search) !== null && _a !== void 0 ? _a : null;
});
function useSearchActorRef() {
    return (0, useDiagram_1.useDiagramSnapshot)(select, Object.is);
}
