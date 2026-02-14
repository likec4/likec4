"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataProvider = MetadataProvider;
exports.MetadataValue = MetadataValue;
var css_1 = require("@likec4/styles/css");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
function MetadataProvider(_a) {
    var children = _a.children;
    return <>{children}</>;
}
function TruncatedValue(_a) {
    var value = _a.value, isExpanded = _a.isExpanded;
    var _b = (0, react_1.useState)(false), isTruncated = _b[0], setIsTruncated = _b[1];
    var textRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (textRef.current) {
            setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
        }
    }, [value]);
    return (<core_1.Tooltip label={isTruncated && !isExpanded ? value : null} multiline w={300} withinPortal>
      <core_1.Text ref={textRef} component="div" className={(0, css_1.css)({
            fontSize: 'sm',
            padding: 'xs',
            userSelect: 'all',
            color: 'text',
            lineHeight: 1.4,
            whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
            overflow: isExpanded ? 'visible' : 'hidden',
            textOverflow: isExpanded ? 'unset' : 'ellipsis',
            wordBreak: isExpanded ? 'break-word' : 'normal',
            minWidth: 0,
            width: '100%',
        })}>
        {value}
      </core_1.Text>
    </core_1.Tooltip>);
}
function MultiValueDisplay(_a) {
    var values = _a.values, isExpanded = _a.isExpanded;
    if (isExpanded) {
        return (<core_1.Stack gap="xs">
        {values.map(function (value, index) { return (<core_1.Flex key={index} align="center" gap="xs">
            <core_1.Text className={(0, css_1.css)({
                    fontSize: 'xs',
                    color: 'mantine.colors.gray[5]',
                    fontWeight: 'medium',
                    flexShrink: 0,
                    _dark: {
                        color: 'mantine.colors.dark[3]',
                    },
                })}>
              •
            </core_1.Text>
            <core_1.Box className={(0, css_1.css)({
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                })}>
              <TruncatedValue value={value} isExpanded={true}/>
            </core_1.Box>
          </core_1.Flex>); })}
      </core_1.Stack>);
    }
    return (<core_1.Box className={(0, css_1.css)({
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            padding: 'xs',
            gap: 'xs',
            flexWrap: 'wrap',
            minWidth: 0, // Allow shrinking
            overflow: 'hidden', // Prevent overflow
        })}>
      {values.map(function (value, index) { return (<core_1.Flex key={index} align="center" gap="xs" style={{ minWidth: 0 }}>
          <core_1.Text className={(0, css_1.css)({
                fontSize: 'sm',
                padding: '[4px 8px]',
                backgroundColor: 'white',
                color: 'text',
                borderRadius: 'sm',
                border: '1px solid',
                borderColor: 'mantine.colors.gray[3]',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 'min(200px, 100%)',
                minWidth: '60px',
                flex: '0 1 auto',
                userSelect: 'all',
                _dark: {
                    backgroundColor: 'mantine.colors.dark[9]',
                    borderColor: 'mantine.colors.dark[4]',
                },
            })} title={value}>
            {value}
          </core_1.Text>
          {index < values.length - 1 && (<core_1.Text className={(0, css_1.css)({
                    fontSize: 'xs',
                    color: 'mantine.colors.gray[5]',
                    fontWeight: 'medium',
                    flexShrink: 0,
                    _dark: {
                        color: 'mantine.colors.dark[3]',
                    },
                })}>
              •
            </core_1.Text>)}
        </core_1.Flex>); })}
    </core_1.Box>);
}
function MetadataValue(_a) {
    var label = _a.label, value = _a.value;
    var elements = Array.isArray(value)
        ? value
        : typeof value === 'string' && value.includes('\n')
            ? value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
            : [value];
    var hasMultipleElements = elements.length > 1;
    var _b = (0, react_1.useState)(false), isExpanded = _b[0], setIsExpanded = _b[1];
    var handleToggle = function () {
        setIsExpanded(!isExpanded);
    };
    return (<>
      {hasMultipleElements
            ? (<core_1.UnstyledButton onClick={handleToggle} className={(0, css_1.css)({
                    fontSize: 'xs',
                    color: 'text.dimmed',
                    justifySelf: 'end',
                    textAlign: 'right',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'xs',
                    padding: '[4px 8px]',
                    borderRadius: 'sm',
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease',
                    _hover: {
                        backgroundColor: 'mantine.colors.gray[1]',
                        color: 'mantine.colors.primary[6]',
                        _dark: {
                            backgroundColor: 'mantine.colors.dark[7]',
                            color: 'mantine.colors.primary[4]',
                        },
                    },
                })}>
            <core_1.Flex align="center" gap="xs">
              <core_1.Text component="span" size="xs" fw={700}>
                {label}:
              </core_1.Text>
              <core_1.Text component="span" className={(0, css_1.css)({
                    fontSize: 'xs',
                    fontWeight: 'medium',
                    color: 'mantine.colors.gray[6]',
                    backgroundColor: 'mantine.colors.gray[1]',
                    padding: '[1px 4px]',
                    borderRadius: 'xs',
                    _dark: {
                        color: 'mantine.colors.dark[2]',
                        backgroundColor: 'mantine.colors.dark[6]',
                    },
                })}>
                {elements.length}
              </core_1.Text>
              {isExpanded ? <icons_react_1.IconChevronDown size={12}/> : <icons_react_1.IconChevronRight size={12}/>}
            </core_1.Flex>
          </core_1.UnstyledButton>)
            : (<core_1.Text component="div" className={(0, css_1.css)({
                    fontSize: 'xs',
                    color: 'text.dimmed',
                    justifySelf: 'end',
                    textAlign: 'right',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    padding: '[4px 8px]',
                    fontWeight: '[700]',
                })}>
            {label}:
          </core_1.Text>)}

      <core_1.Box className={(0, css_1.css)({
            justifySelf: 'stretch',
            alignSelf: 'start',
        })}>
        {hasMultipleElements
            ? (<MultiValueDisplay values={elements} isExpanded={isExpanded}/>)
            : (<core_1.Box className={(0, css_1.css)({
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                })}>
              <TruncatedValue value={elements[0] || ''} isExpanded={isExpanded}/>
            </core_1.Box>)}
      </core_1.Box>
    </>);
}
