// ElementStyleProperties: 'style' OpenBlock
//     (props+=AbstractElementStyleProperty)*
//   CloseBlock;
// ElementStyleProperties: (props+=ElementStyleProperty)*;

ColorProperty: key='color' Colon? value=ThemeColor;
ShapeProperty: key='shape' Colon? value=ElementShape;

AStyleProperty: ColorProperty | ShapeProperty;

// -------------------------

ElementKind: name=Name;
Tag: name=Name;

ThemeColor returns string: 'primary' | 'secondary' | 'muted';

ElementShape returns string: 'rectangle' | 'person' | 'browser' | 'cylinder' | 'storage' | 'queue';

Name returns string: ElementShape | ThemeColor | 'model' | ID;

// -------------------------

terminal Dot: '.';
terminal Eq: '=';
terminal OpenBlock: '{';
terminal CloseBlock: '}';
terminal Colon: ':';
terminal Comma: ',';
terminal Star: '*';
terminal Semi: ';';

terminal TagID returns string: '#' ID;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal WS: /[ \t\r\n\f]+/;

// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
