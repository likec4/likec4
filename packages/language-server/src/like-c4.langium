grammar LikeC4

entry LikeC4Document:
  specification=SpecificationRule?
  model=Model?
  views=ModelViews?
;

// Specification -------------------------------------

ElementKind: name=Name;
Tag: name=Name;

SpecificationRule:
  name='specification' OpenBlock
    (elements+=SpecificationElementKind | tags+=SpecificationTag)*
  CloseBlock;

SpecificationElementKind:
  'element' kind=ElementKind (OpenBlock
    style=StyleProperties?
  CloseBlock)?;

SpecificationTag:
  'tag' tag=Tag (OpenBlock
    style=StyleProperties?
  CloseBlock)?;

// Model -------------------------------------

Model:
  name='model' OpenBlock
    elements+=(
      Element |
      ExtendElement |
      ExplicitRelation
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

ElementProperty: ElementStringProperty | StyleProperties;

ElementStringProperty:
  key=('title' | 'technology' | 'description') Colon? value=STRING SemiColon?;

ExtendElement:
  'extend' element=StrictElementRef body=ExtendElementBody;

ExtendElementBody: OpenBlock
  elements+=(
    Element |
    ExplicitRelation
  )*
CloseBlock ;

StrictElementRef:
  el=[Element:Name] (Dot next=StrictElementRef)?;

ElementRef:
  el=[Element:Name] (Dot next=ElementRef)?;

Tags:
  value+=[Tag:TagID] (Comma? value+=[Tag:TagID])*;

Relation: ExplicitRelation | ImplicitRelation;

fragment RelationFragment:
  target=ElementRef
  (title=STRING)?
  body=RelationBody?
;

ImplicitRelation infers Relation:
  ('this' | 'it')? arr=RArrow RelationFragment;

ExplicitRelation infers Relation:
  source=ElementRef arr=RArrow RelationFragment;

RelationBody: OpenBlock
  tags=Tags?
  (props+=RelationStringProperty)*
CloseBlock;

RelationStringProperty:
  key='title' Colon? value=STRING SemiColon?;


// Views -------------------------------------

ModelViews:
  name='views' OpenBlock
    views+=View*
  CloseBlock;

View:
  {infer ElementView} 'view' name=Name? ('of' viewOf=ElementRef)? OpenBlock
    tags=Tags?
    (props+=(ViewProperty | LinkProperty))*
    rules+=(
      ViewRuleExpression |
      ViewRuleStyle |
      ViewRuleAutoLayout
    )*
  CloseBlock;

ViewProperty:
  key=('title' | 'description') Colon? value=STRING SemiColon?;

type ViewRule = ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout;

ViewRuleExpression:
  (isInclude?='include' | 'exclude') expressions+=Expression (Comma expressions+=Expression)*;

ViewRuleLayoutDirection returns string: 'TopBottom' | 'LeftRight' | 'BottomTop' | 'RightLeft';

ViewRuleAutoLayout:
  'autoLayout' direction=ViewRuleLayoutDirection;

ViewRuleStyle:
  'style' targets+=ElementExpression (Comma targets+=ElementExpression)* OpenBlock
    StylePropertiesFragment
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

LinkProperty: key='link' Colon? value=Uri SemiColon?;
IconProperty: key='icon' Colon? value=Uri SemiColon?;

ColorProperty: key='color' Colon? value=ThemeColor SemiColon?;
ShapeProperty: key='shape' Colon? value=ElementShape SemiColon?;

StyleProperties:
  key='style' OpenBlock
    StylePropertiesFragment
  CloseBlock;

fragment StylePropertiesFragment:
  (props+=(
    ColorProperty | ShapeProperty | IconProperty
  ))*
;

// type AnyStringProperty = ViewProperty | ElementStringProperty | RelationStringProperty | LinkProperty;
// type AStyleProperty = ColorProperty | ShapeProperty | IconProperty;

// -------------------------

ThemeColor returns string: 'primary' | 'secondary' | 'muted' | 'slate' | 'blue' | 'indigo' | 'sky' | 'red' | 'gray' | 'green' | 'amber';
ElementShape returns string: 'rectangle' | 'person' | 'browser' | 'mobile' | 'cylinder' | 'storage' | 'queue';
Name returns string: ElementShape | ThemeColor | 'element' | 'model' | ID;
Uri returns string: URI_WITH_SCHEMA | URI_RELATIVE;

RArrow returns string: RARROW;

fragment IsEqual:
  (NotEqual | isEqual?=Eq);

// -----------------------------------
// Symbols
terminal fragment HASH      : '#';
terminal fragment UNDERSCORE: '_';
terminal fragment DASH: '-';
terminal fragment LETTER       : /[^\W\d_]/;
terminal fragment DIGIT        : /[0-9]/;
terminal fragment NEWLINE: /[\t\r\n\v\f]/;
terminal fragment SPACE: /[^\S\r\n]/;


// -----------------------------------
// Terminals

terminal URI_WITH_SCHEMA: /\w+:\/\/\S+/;
terminal URI_RELATIVE: /\.{0,2}\/[^\/]\S+/;

terminal RARROW: '->';
terminal Dot: /\b\.\b/;
terminal NotEqual: '!=';
terminal Eq: '=';
terminal OpenBlock: '{';
terminal CloseBlock: '}';
terminal Colon: ':';
terminal SemiColon: ';';
terminal Comma: ',';

terminal TagID: HASH LETTER (LETTER | DIGIT | UNDERSCORE | DASH)*;
terminal ID: (LETTER | UNDERSCORE) (LETTER | DIGIT | UNDERSCORE | DASH)*;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal WS: (NEWLINE | SPACE)+;

// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
