ElementStyleProperties: OpenBlock
    (props+=AbstractElementStyleProperty)*
  CloseBlock;

AbstractElementStyleProperty: (
  {infer ElementShapeStyleProperty} key='shape' Colon? value=ElementShape
);

// -------------------------

ElementKind: name=Name;
Tag: name=Name;

ElementShape returns string: 'rectangle' | 'person' | 'browser' | 'cylinder' | 'storage' | 'queue';

Name returns string: ElementShape | ID;

StringValue returns string:
  Name | STRING;

// -------------------------

terminal LArrow: '->';
terminal Dot: '.';
terminal Eq: '=';
terminal OpenBlock: '{';
terminal CloseBlock: '}';
terminal Colon: ':';
terminal Semi: ';';

terminal TagID returns string: '#' ID;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal WS: /[ \t\r\n\f]+/;

// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
