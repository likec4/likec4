"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOverlaysActorRef = useOverlaysActorRef;
var useDiagram_1 = require("./useDiagram");
var select = (0, useDiagram_1.selectDiagramActor)(function (s) {
    return s.children.overlays;
});
function useOverlaysActorRef() {
    return (0, useDiagram_1.useDiagramSnapshot)(select, Object.is);
}
