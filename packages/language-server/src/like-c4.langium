grammar LikeC4

entry LikeC4Document:
  specification=SpecificationRule?
  model=Model?
  views=ModelViews?
;

// Specification -------------------------------------

ElementKind: name=Name;
Tag: name=Name;
RelationshipKind: name=Name;

SpecificationRule:
  name='specification' OpenBlock
    (elements+=SpecificationElementKind | tags+=SpecificationTag | relationships+=SpecificationRelationshipKind)*
  CloseBlock;

SpecificationElementKind:
  'element' kind=ElementKind (OpenBlock
    style=StyleProperties?
  CloseBlock)?;

SpecificationTag:
  'tag' tag=Tag (OpenBlock
    style=StyleProperties?
  CloseBlock)?;

SpecificationRelationshipKind:
  'relationship' kind=RelationshipKind (OpenBlock
    RelationshipStylePropertiesFragment
  CloseBlock)?
;

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
  (props+=String  // title
    (props+=String  // description
      (props+=String  // technology
        (props+=String)?   // tags
      )?
    )?
  )?
  (OpenBlock body=ElementBody CloseBlock)?;

ElementBody:
  tags=Tags?
  props+=(ElementProperty | LinkProperty)*
  elements+=(
    Element |
    Relation
  )*
;

ElementProperty: ElementStringProperty | StyleProperties;

ElementStringProperty:
  key=('title' | 'technology' | 'description') Colon? value=String SemiColon?;

ExtendElement:
  'extend' element=FqnElementRef body=ExtendElementBody;

ExtendElementBody: OpenBlock
  elements+=(
    Element |
    ExplicitRelation
  )*
CloseBlock ;

//
FqnElementRef:
  el=[Element:Name] ({infer FqnElementRef.parent=current} Dot el=[Element:Name])*;

ElementRef:
  el=[Element:Name] ({infer ElementRef.parent=current} Dot el=[Element:Name])*;

Tags:
  value+=[Tag:TagID] (Comma? value+=[Tag:TagID])*;

Relation: ExplicitRelation | ImplicitRelation;

fragment RelationFragment:
  (RArrow | '-[' kind=[RelationshipKind:Name] ']->')
  target=ElementRef
  (title=String)?
  (OpenBlock
    tags=Tags?
    props+=RelationStringProperty*
  CloseBlock) ?
;

ImplicitRelation infers Relation:
  ('this' | 'it')? RelationFragment;

ExplicitRelation infers Relation:
  source=ElementRef RelationFragment;

RelationStringProperty:
  key='title' Colon? value=String SemiColon?;


// Views -------------------------------------

ModelViews:
  name='views' OpenBlock
    views+=View*
  CloseBlock;

View:
  ElementView;

ElementView:
  'view' name=Name? (
    'extends' extends=ElementViewRef |
    'of' viewOf=ElementRef
  )? body=ElementViewBody;

ElementViewRef:
  view=[ElementView:Name];

ElementViewBody: OpenBlock
  tags=Tags?
  (props+=(ViewProperty | LinkProperty))*
  rules+=(
    ViewRuleExpression |
    ViewRuleStyle |
    ViewRuleAutoLayout
  )*
CloseBlock;

ViewProperty:
  key=('title' | 'description') Colon? value=String SemiColon?;

type ViewRule = ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout;

ViewRuleExpression:
  (isInclude?='include' | 'exclude') expressions+=Expression (Comma expressions+=Expression?)*;

ViewRuleLayoutDirection returns string: 'TopBottom' | 'LeftRight' | 'BottomTop' | 'RightLeft';

ViewRuleAutoLayout:
  'autoLayout' direction=ViewRuleLayoutDirection;

ViewRuleStyle:
  'style' targets+=ElementExpression (Comma targets+=ElementExpression?)* OpenBlock
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
  {infer IncomingExpression} RArrow target=ElementExpression (
    {infer InOutExpression.inout=current} RArrow
  )? |
  ElementExpression (
    {infer RelationExpression.source=current} RArrow target=ElementExpression |
    {infer OutgoingExpression.source=current} RArrow
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

ElementRefExpression: id=ElementRef (isDescedants?=DotWildcard)?;

// Common -------------------------------------

LinkProperty: key='link' Colon? value=Uri SemiColon?;
IconProperty: key='icon' Colon? value=Uri SemiColon?;

ColorProperty: key='color' Colon? value=ThemeColor SemiColon?;
ShapeProperty: key='shape' Colon? value=ElementShape SemiColon?;

LineProperty: key='line' Colon? value=LineOptions SemiColon?;
ArrowProperty: key=('head' | 'tail') Colon? value=ArrowType SemiColon?;


StyleProperties:
  key='style' OpenBlock
    StylePropertiesFragment
  CloseBlock;

fragment StylePropertiesFragment:
  (props+=(
    ColorProperty | ShapeProperty | IconProperty
  ))*
;

fragment RelationshipStylePropertiesFragment:
  (props+=(
    ColorProperty | LineProperty | ArrowProperty
  ))*
;

// type AnyStringProperty = ViewProperty | ElementStringProperty | RelationStringProperty | LinkProperty;
// type AStyleProperty = ColorProperty | ShapeProperty | IconProperty;

// -------------------------
// Relationship Style Properties
LineOptions returns string: 'solid' | 'dashed' | 'dotted';
ArrowType returns string:
  'none' |
  'normal' |
  'onormal' |
  'diamond' |
  'odiamond' |
  'crow' |
  'open' |
  'vee'
;

ThemeColor returns string: 'primary' | 'secondary' | 'muted' | 'slate' | 'blue' | 'indigo' | 'sky' | 'red' | 'gray' | 'green' | 'amber';
ElementShape returns string: 'rectangle' | 'person' | 'browser' | 'mobile' | 'cylinder' | 'storage' | 'queue';
Uri returns string: URI_WITH_SCHEMA | URI_RELATIVE;

Name returns string: ElementShape | ThemeColor | LineOptions | ArrowType | 'element' | 'model' | ID;

fragment IsEqual:
  (NotEqual | isEqual?=Eq);


// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal WS: (NEWLINE | SPACE)+;

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

terminal RArrow: '->';
terminal DotWildcard: /\b\.\*/;
terminal Dot: /\b\./;
terminal NotEqual: '!=';
terminal Eq: /\={1,2}/ ;
terminal OpenBlock: '{';
terminal CloseBlock: '}';
terminal Colon: ':';
terminal SemiColon: ';';
terminal Comma: ',';

terminal String: /"[^"]*"|'[^']*'/;

terminal TagID: HASH LETTER (LETTER | DIGIT | UNDERSCORE | DASH)*;
terminal ID: (LETTER | UNDERSCORE) (LETTER | DIGIT | UNDERSCORE | DASH)*;
