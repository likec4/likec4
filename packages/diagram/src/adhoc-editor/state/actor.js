"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adhocEditorLogic = void 0;
var actor_editor_1 = require("./actor.editor");
var actor_layouter_1 = require("./actor.layouter");
var actor_types_1 = require("./actor.types");
var _adhocEditorLogic = actor_types_1.machine.createMachine({
    id: 'adhoc-editor',
    context: actor_types_1.createContext,
    type: 'parallel',
    states: {
        layouter: actor_layouter_1.layouter,
        editor: actor_editor_1.editor,
    },
});
exports.adhocEditorLogic = _adhocEditorLogic;
