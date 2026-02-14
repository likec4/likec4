"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchActor = useSearchActor;
exports.useSearch = useSearch;
exports.useNormalizedSearch = useNormalizedSearch;
exports.useUpdateSearch = useUpdateSearch;
var react_1 = require("@xstate/react");
var react_2 = require("react");
var useSearchActor_1 = require("../hooks/useSearchActor");
function useSearchActor() {
    var searchActorRef = (0, useSearchActor_1.useSearchActorRef)();
    if (!searchActorRef) {
        throw new Error('Search actor not found');
    }
    return searchActorRef;
}
var selectSearchValue = function (s) { return s.context.searchValue; };
function useSearch() {
    var searchActorRef = useSearchActor();
    var searchValue = (0, react_1.useSelector)(searchActorRef, selectSearchValue);
    var updateSearch = (0, react_2.useCallback)(function (search) {
        searchActorRef.send({ type: 'change.search', search: search });
    }, [searchActorRef]);
    return [searchValue, updateSearch];
}
var selectNormalizedSearchValue = function (s) {
    var v = selectSearchValue(s);
    if (v === '')
        return v;
    v = v.trim().toLowerCase();
    if (v.startsWith('#') && v.length <= 2) {
        return '';
    }
    return v.length > 1 ? v : '';
};
function useNormalizedSearch() {
    var searchActorRef = useSearchActor();
    return (0, react_2.useDeferredValue)((0, react_1.useSelector)(searchActorRef, selectNormalizedSearchValue));
}
function useUpdateSearch() {
    var searchActorRef = useSearchActor();
    return (0, react_2.useCallback)(function (search) {
        searchActorRef.send({ type: 'change.search', search: search });
    }, [searchActorRef]);
}
