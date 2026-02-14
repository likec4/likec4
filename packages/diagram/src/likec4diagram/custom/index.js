"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltinEdges = exports.BuiltinNodes = void 0;
var RelationshipEdge_1 = require("./edges/RelationshipEdge");
var SequenceStepEdge_1 = require("./edges/SequenceStepEdge");
var nodes_1 = require("./nodes");
exports.BuiltinNodes = {
    ElementNode: nodes_1.ElementNode,
    DeploymentNode: nodes_1.DeploymentNode,
    CompoundElementNode: nodes_1.CompoundElementNode,
    CompoundDeploymentNode: nodes_1.CompoundDeploymentNode,
    ViewGroupNode: nodes_1.ViewGroupNode,
    SequenceActorNode: nodes_1.SequenceActorNode,
    SequenceParallelArea: nodes_1.SequenceParallelArea,
};
exports.BuiltinEdges = {
    RelationshipEdge: RelationshipEdge_1.RelationshipEdge,
    SequenceStepEdge: SequenceStepEdge_1.SequenceStepEdge,
};
