"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchByTags = SearchByTags;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var base_primitives_1 = require("../../base-primitives");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var hooks_1 = require("../hooks");
var utils_1 = require("./utils");
function SearchByTags() {
    var ref = (0, react_1.useRef)(null);
    var tags = (0, useLikeC4Model_1.useLikeC4Model)().tagsSortedByUsage;
    var setSearch = (0, hooks_1.useUpdateSearch)();
    var search = (0, hooks_1.useNormalizedSearch)();
    var countBefore = tags.length;
    var isFiltered = false;
    if (search.startsWith('#')) {
        var searchTag_1 = search.slice(1);
        tags = tags.filter(function (_a) {
            var tag = _a.tag;
            return tag.toLocaleLowerCase().includes(searchTag_1);
        });
        isFiltered = tags.length !== countBefore;
    }
    if (tags.length === 0) {
        return null;
    }
    // Show top 15 tags only
    tags = tags.slice(0, 15);
    return (<jsx_1.HStack ref={ref} css={{
            gap: 'md',
            paddingLeft: '[48px]',
            flexWrap: 'nowrap',
        }}>
      <jsx_1.HStack css={{
            gap: '1.5', // 6px
            flexWrap: 'wrap',
            opacity: isFiltered ? 1 : .3,
            grayscale: isFiltered ? 0 : .9,
            filter: 'auto',
            transition: 'fast',
            _groupHover: {
                opacity: 1,
                grayscale: 0,
            },
            _groupFocusWithin: {
                opacity: 1,
                grayscale: 0,
            },
        }}>
        {tags.map(function (_a) {
            var tag = _a.tag;
            return (<base_primitives_1.ElementTag key={tag} tag={tag} className={(0, css_1.css)({
                    userSelect: 'none',
                    cursor: 'pointer',
                })} onClick={function (e) {
                    e.stopPropagation();
                    setSearch("#".concat(tag));
                    // Let react to display filtered elements
                    setTimeout(function () {
                        (0, utils_1.focusToFirstFoundElement)(ref.current);
                    }, 350);
                }}/>);
        })}
      </jsx_1.HStack>
      {isFiltered && (<core_1.Button size="compact-xs" variant="light" onClick={function (e) {
                e.stopPropagation();
                setSearch('');
                (0, utils_1.moveFocusToSearchInput)(ref.current);
            }} rightSection={<icons_react_1.IconX size={14}/>}>
          Clear
        </core_1.Button>)}
    </jsx_1.HStack>);
}
