"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsOverviewViewportPersistence = void 0;
var key = "likec4:projects-overview:lastViewport";
exports.ProjectsOverviewViewportPersistence = {
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
    write: function (viewport) {
        if (!viewport) {
            sessionStorage.removeItem(key);
            return;
        }
        sessionStorage.setItem(key, JSON.stringify(viewport));
    },
};
