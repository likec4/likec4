"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagramToggledFeaturesPersistence = void 0;
var remeda_1 = require("remeda");
var key = "likec4:diagram:toggledFeatures";
exports.DiagramToggledFeaturesPersistence = {
    read: function () {
        try {
            var fromStorage = sessionStorage.getItem(key);
            if (fromStorage) {
                return JSON.parse(fromStorage);
            }
            return null;
        }
        catch (e) {
            console.error("Error reading fromStorage ".concat(key, ":"), e);
            return null;
        }
    },
    write: function (toggledFeatures) {
        sessionStorage.setItem(key, JSON.stringify((0, remeda_1.pickBy)(toggledFeatures, remeda_1.isBoolean)));
        return toggledFeatures;
    },
};
