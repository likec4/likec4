grammar LikeC4

entry LikeC4Document:
  specification=SpecificationRule?
  model=Model?
  views=ModelViews?
;

// Specification -------------------------------------

SpecificationRule:
  name='specification' OpenBlock
  (
    elementKinds+=SpecificationElementKind |
    tags+=SpecificationTag
  )*
  CloseBlock;

SpecificationElementKind:
  'element' kind=ElementKind (OpenBlock
    style=SpecificationElementKindStyle?
  CloseBlock)?;

SpecificationElementKindStyle: 'style' OpenBlock
    (props+=(
      ColorProperty | ShapeProperty
    ))*
  CloseBlock;

SpecificationTag:
  'tag' tag=Tag (OpenBlock
    style=SpecificationTagStyle?
  CloseBlock)?;

SpecificationTagStyle: 'style' OpenBlock
    (props+=(
      ColorProperty | ShapeProperty
    ))*
  CloseBlock;

// Model -------------------------------------

Model:
  name='model' OpenBlock
    elements+=(
      Element |
      ExtendElement |
      RelationWithSource
    )*
  CloseBlock;

Element:
  (
    kind=[ElementKind:Name] name=Name |
    name=Name Eq kind=[ElementKind:Name]
  )
  (props+=STRING  // title
    (props+=STRING  // description
      (props+=STRING  // technology
        (props+=STRING)?   // tags
      )?
    )?
  )?
  body=ElementBody?;

ElementBody: OpenBlock
  tags=Tags?
  (props+=(ElementProperty | LinkProperty))*

  elements+=(
    Element |
    Relation
  )*
CloseBlock;

ElementProperty: (
  {infer ElementStringProperty} key=('title' | 'description' | 'technology') Colon? value=STRING |
  {infer ElementStyleProperty} key='style' OpenBlock
    (props+=(
      ColorProperty | ShapeProperty
    ))*
  CloseBlock
);


// ElementProperty:
//   LinkProperty |
//   ElementStringProperty |
//   ElementStyleProperty
// ;

// ElementStringProperty infers AnyStringProperty:
//   {infer ElementStringProperty} key=('title' | 'description' | 'technology') Colon? value=STRING;

// ElementStyleProperty:
//   key='style' OpenBlock
//     (props+=(
//       ColorProperty | ShapeProperty
//     ))*
//   CloseBlock;

ExtendElement:
  'extend' element=StrictElementRef body=ExtendElementBody;

ExtendElementBody: OpenBlock
  elements+=(
    Element |
    RelationWithSource
  )*
CloseBlock ;

StrictElementRef:
  el=[Element:Name] (Dot next=StrictElementRef)?;

ElementRef:
  el=[Element:Name] (Dot next=ElementRef)?;

Tags:
  value+=[Tag:TagID] (Comma? value+=[Tag:TagID])*;

Relation: RelationWithSource | RelationWithoutSource;

fragment RelationFragment:
  target=ElementRef
  (title=STRING)?
  definition=RelationBody?
;

RelationWithoutSource infers Relation:
  ('this' | 'it')? arr=RArrow RelationFragment;

RelationWithSource:
  source=ElementRef arr=RArrow RelationFragment;

// RelationWithSource: {infer RelationWithSource2} RelationWithSourceRule;

RelationBody: OpenBlock
  tags=Tags?
  (props+=RelationStringProperty)*
CloseBlock;

RelationStringProperty:
  key=('title') Colon? value=STRING;


// Views -------------------------------------

ModelViews:
  name='views' OpenBlock
    views+=View*
  CloseBlock;

View:
  {infer ElementView} 'view' name=Name? ('of' viewOf=ElementRef)? OpenBlock
    properties+=ViewProperty*
    rules+=(
      ViewRuleExpression |
      ViewRuleStyle |
      ViewRuleAutoLayout
    )*
  CloseBlock;

ViewProperty:
  key=('title' | 'description') Colon? value=STRING;

type ViewRule = ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout;

ViewRuleExpression:
  (isInclude?='include' | 'exclude') expressions+=Expression (Comma expressions+=Expression)*;

ViewRuleLayoutDirection returns string: 'TopBottom' | 'LeftRight' | 'BottomTop' | 'RightLeft';

ViewRuleAutoLayout:
  'autoLayout' direction=ViewRuleLayoutDirection;

ViewRuleStyle:
  'style' targets+=ElementExpression (Comma targets+=ElementExpression)* OpenBlock
    (props+=(
      ColorProperty | ShapeProperty
    ))*
CloseBlock;
//   'style' targets+=ElementExpression (COMMA? targets+=ElementExpression)* OPEN_BLOCK
//   (styleProps+=StyleProperty)*
// CLOSE_BLOCK;

// DynamicViewSteps:
//   'steps' OPEN_BLOCK
//     step+=DynamicViewStep+
//   CLOSE_BLOCK;

// DynamicViewStep:
//   source=ElementRef (isReverse?='<-' | '->') target=ElementRef (title=STRING)? SEMI?;

Expression:
  {infer IncomingExpression} arr=RArrow target=ElementExpression (
    {infer InOutExpression.inout=current} arr=RArrow
  )? |
  ElementExpression (
    {infer RelationExpression.source=current} arr=RArrow target=ElementExpression |
    {infer OutgoingExpression.source=current} arr=RArrow
  )?
;

ElementExpression:
  {infer WildcardExpression} isWildcard?='*' |
  'element' Dot (
    {infer ElementTagExpression} 'tag' IsEqual tag=[Tag:TagID] |
    {infer ElementKindExpression} 'kind' IsEqual kind=[ElementKind:Name]
  ) |
  ElementRefExpression
  // {infer IdentifierExpression} id=ElementRef isDescedants?='.*'?
  // 'element' '.' (
  //   {infer ElementTagExpression} 'tag' IsEqual tags+=[Tag:TagID] (COMMA tags+=[Tag:TagID])* |
  //   {infer ElementKindExpression} 'kind' IsEqual kinds+=[ElementKind:Name] (COMMA kinds+=[ElementKind:Name])*
  // ) |
  // {infer IdentifierExpression} id=ElementRef isDescedants?=DESCEDANTS?
  // {infer IdentifierExpression} id=ElementRef (
  //   '['
  //     'onclick' ('zoom' 'to' | 'show') view=[View:Name]
  //   ']' |
  //   isDescedants?=DESCEDANTS
  // )?
;

ElementRefExpression: id=ElementRef (isDescedants?='.*')?;

// Common -------------------------------------

LinkProperty: key='link' Colon? value=Uri;

ColorProperty: key='color' Colon? value=ThemeColor;
ShapeProperty: key='shape' Colon? value=ElementShape;

type AnyStringProperty = ViewProperty | ElementStringProperty | RelationStringProperty | LinkProperty;
type AStyleProperty = ColorProperty | ShapeProperty;

// -------------------------

ElementKind: name=Name;
Tag: name=Name;

ThemeColor returns string: 'primary' | 'secondary' | 'muted' | 'slate' | 'blue' | 'indigo' | 'sky' | 'red' | 'gray' | 'green' | 'amber';
ElementShape returns string: 'rectangle' | 'person' | 'browser' | 'mobile' | 'cylinder' | 'storage' | 'queue';
Name returns string: ElementShape | ThemeColor | 'element' | 'model' | ID;
Uri returns string: URI_WITH_SCHEMA | Dot* URI_RELATIVE;

RArrow returns string: RARROW;

fragment IsEqual:
  (NotEqual | isEqual?=Eq);

// -----------------------------------
// Terminals

terminal RARROW: '->';
terminal Dot: DOT;
terminal NotEqual: '!=';
terminal Eq: '=';
terminal OpenBlock: '{';
terminal CloseBlock: '}';
terminal Colon: COLON;
terminal Comma: ',';
// terminal Star: '*';
// terminal Semi: ';';
// terminal EOL: (WS+)? NL;

terminal URI_WITH_SCHEMA: /(\w+:\/\/)[^\s]+/;
terminal URI_RELATIVE: /\/[^\s]+/;

// terminal URI_WITH_SCHEMA: LETTER+ COLON SLASH SLASH LETTER+;
terminal TagID: HASH LETTER (LETTER | DIGIT | UNDERSCORE)*;
terminal ID: (LETTER | UNDERSCORE) (LETTER | DIGIT | UNDERSCORE)*;
terminal STRING: /"[^"]*"|'[^']*'/;


// -----------------------------------
// Symbols
// terminal fragment NON_SPACE: DOT | LETTER | DIGIT | UNDERSCORE | SLASH;
terminal fragment DOT       :  '.';
// terminal fragment SLASH     : '/';
terminal fragment HASH      : '#';
terminal fragment UNDERSCORE: '_';
terminal fragment COLON: ':';
// terminal fragment LowerLetter  : /a-z/;
terminal fragment LETTER       : /[^\W\d_]/;
terminal fragment DIGIT        : /[0-9]/;
terminal fragment NEWLINE: /[\t\r\n\v\f]/;
terminal fragment SPACE: /[^\S\r\n]/;

hidden terminal WS: (NEWLINE | SPACE)+;

// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
