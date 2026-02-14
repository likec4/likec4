"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4SearchInput = void 0;
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var remeda_1 = require("remeda");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var hooks_2 = require("../hooks");
var css = require("./styles.css");
var utils_1 = require("./utils");
function startingWithKind(search) {
    return search.match(/^(k|ki|kin|kind|kind:)$/) != null;
}
var SEARCH_PREFIXES = ['#', 'kind:'];
exports.LikeC4SearchInput = (0, react_1.memo)(function () {
    var searchActorRef = (0, hooks_2.useSearchActor)();
    var likec4model = (0, useLikeC4Model_1.useLikeC4Model)();
    var inputRef = (0, react_1.useRef)(null);
    var _a = (0, hooks_1.useFocusWithin)(), ref = _a.ref, focused = _a.focused;
    var _b = (0, hooks_2.useSearch)(), search = _b[0], setSearch = _b[1];
    // const previous = usePreviousDistinct(search)
    // const [isEmptyForSomeTime, cancel] = useDebouncedValue(
    //   focused ? search : 'rstrs',
    //   2000,
    // )
    // // useF
    // // const isEmptyForSomeTime = debouncedSearch === ''
    // useEffect(() => {
    //   // cancel()
    // }, [])
    var combobox = (0, core_1.useCombobox)({
        scrollBehavior: 'smooth',
        loop: false,
    });
    (0, hooks_1.useWindowEvent)('keydown', function (event) {
        try {
            if (!focused && (event.key === 'Backspace' ||
                event.key.startsWith('Arrow') ||
                event.key.match(/^\p{L}$/u))) {
                (0, utils_1.moveFocusToSearchInput)(inputRef.current);
            }
        }
        catch (e) {
            console.warn(e);
        }
    });
    var options = [];
    var isExactMatch = false;
    switch (true) {
        // case search === '' && isEmptyForSomeTime === '': {
        //   options = SEARCH_PREFIXES.map((prefix) => (
        //     <ComboboxOption value={prefix} key={prefix}>
        //       <Text component="span" opacity={.5} mr={4} fz={'sm'}>Search by</Text>
        //       {prefix}
        //     </ComboboxOption>
        //   ))
        //   break
        // }
        case search.startsWith('#'): {
            var searchTag_1 = search.toLocaleLowerCase().slice(1);
            var alloptions = likec4model.tags.filter(function (tag) { return tag.toLocaleLowerCase().includes(searchTag_1); });
            if (alloptions.length === 0) {
                isExactMatch = false;
                options = [
                    <core_1.ComboboxEmpty key="empty-tags">
            No tags found
          </core_1.ComboboxEmpty>,
                ];
            }
            else {
                isExactMatch = alloptions.some(function (tag) { return tag.toLocaleLowerCase() === searchTag_1; });
                options = alloptions.map(function (tag) { return (<core_1.ComboboxOption value={"#".concat(tag)} key={tag}>
            <core_1.Text component="span" opacity={.5} mr={1} fz={'sm'}>#</core_1.Text>
            {tag}
          </core_1.ComboboxOption>); });
            }
            break;
        }
        case search.startsWith('kind:'):
        case startingWithKind(search): {
            var term_1 = search.length > 5 ? search.slice(5).toLocaleLowerCase() : '';
            var alloptions = (0, remeda_1.keys)(likec4model.specification.elements);
            if (term_1) {
                alloptions = alloptions.filter(function (kind) { return kind.toLocaleLowerCase().includes(term_1); });
            }
            if (alloptions.length === 0) {
                isExactMatch = false;
                options = [
                    <core_1.ComboboxEmpty key="empty-kinds">
            No kinds found
          </core_1.ComboboxEmpty>,
                ];
            }
            else {
                isExactMatch = alloptions.some(function (kind) { return kind.toLocaleLowerCase() === term_1; });
                options = alloptions.map(function (kind) { return (<core_1.ComboboxOption value={"kind:".concat(kind)} key={kind}>
            <core_1.Text component="span" opacity={.5} mr={1} fz={'sm'}>kind:</core_1.Text>
            {kind}
          </core_1.ComboboxOption>); });
            }
            break;
        }
    }
    return (<core_1.Combobox onOptionSubmit={function (optionValue) {
            setSearch(optionValue);
            combobox.resetSelectedOption();
            if (!SEARCH_PREFIXES.includes(optionValue)) {
                combobox.closeDropdown();
                // Let react to display filtered elements
                setTimeout(function () {
                    (0, utils_1.focusToFirstFoundElement)(inputRef.current);
                }, 350);
            }
        }} width={'max-content'} position="bottom-start" shadow="md" offset={{
            mainAxis: 4,
            crossAxis: 50,
        }} store={combobox} withinPortal={false}>
      <core_1.ComboboxTarget>
        <core_1.Input ref={(0, hooks_1.useMergedRef)(inputRef, ref)} placeholder="Search by title, description or start with # or kind:" autoFocus data-autofocus data-likec4-search-input tabIndex={0} classNames={{
            input: css.input,
        }} size="lg" value={search} leftSection={<icons_react_1.IconSearch style={{ width: (0, core_1.rem)(20) }} stroke={2}/>} rightSection={<core_1.Input.ClearButton onClick={function (e) {
                e.stopPropagation();
                var openedWithSearch = searchActorRef.getSnapshot().context.openedWithSearch;
                if (search === '' || search === openedWithSearch) {
                    searchActorRef.send({ type: 'close' });
                }
                else {
                    setSearch('');
                }
            }}/>} rightSectionPointerEvents="auto" onChange={function (event) {
            setSearch(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
        }} onClick={function () { return combobox.openDropdown(); }} onFocus={function () { return combobox.openDropdown(); }} onBlur={function () { return combobox.closeDropdown(); }} onKeyDownCapture={function (e) {
            if (e.key === 'Tab') {
                switch (true) {
                    case combobox.getSelectedOptionIndex() >= 0: {
                        combobox.clickSelectedOption();
                        return (0, utils_1.stopAndPrevent)(e);
                    }
                    case options.length === 1: {
                        var firstOption = combobox.selectFirstOption();
                        if (firstOption) {
                            combobox.clickSelectedOption();
                        }
                        return (0, utils_1.stopAndPrevent)(e);
                    }
                    case startingWithKind(search): {
                        setSearch('kind:');
                        return (0, utils_1.stopAndPrevent)(e);
                    }
                }
                return;
            }
            if (e.key === 'Backspace' && combobox.dropdownOpened) {
                if (search === 'kind:') {
                    setSearch('');
                    combobox.resetSelectedOption();
                    return (0, utils_1.stopAndPrevent)(e);
                }
                if (search.startsWith('kind:') && isExactMatch) {
                    setSearch('kind:');
                    combobox.resetSelectedOption();
                    return (0, utils_1.stopAndPrevent)(e);
                }
                if (search.startsWith('#') && isExactMatch) {
                    setSearch('#');
                    combobox.resetSelectedOption();
                    return (0, utils_1.stopAndPrevent)(e);
                }
            }
            if (e.key === 'Escape' && combobox.dropdownOpened && options.length > 0) {
                (0, utils_1.stopAndPrevent)(e);
                combobox.closeDropdown();
                return;
            }
            if (e.key === 'ArrowUp' && combobox.dropdownOpened && search === '' && combobox.getSelectedOptionIndex() === 0) {
                combobox.closeDropdown();
                (0, utils_1.stopAndPrevent)(e);
                return;
            }
            if (e.key === 'ArrowDown' && (!combobox.dropdownOpened ||
                options.length === 0 || isExactMatch ||
                // reached the last option and the search is empty
                (search === '' && combobox.getSelectedOptionIndex() === options.length - 1))) {
                combobox.closeDropdown();
                (0, utils_1.stopAndPrevent)(e);
                (0, utils_1.focusToFirstFoundElement)(inputRef.current);
                return;
            }
        }}/>
      </core_1.ComboboxTarget>

      <core_1.ComboboxDropdown hidden={options.length === 0} style={{ minWidth: 300 }}>
        <core_1.ComboboxOptions>
          <core_1.ScrollAreaAutosize mah={'min(322px, calc(100cqh - 50px))'} type="scroll">
            {options}
          </core_1.ScrollAreaAutosize>
        </core_1.ComboboxOptions>
      </core_1.ComboboxDropdown>
    </core_1.Combobox>);
});
