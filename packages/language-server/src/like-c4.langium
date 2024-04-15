grammar LikeC4

entry LikeC4Grammar:
  (
    specifications+=SpecificationRule |
    models+=Model  |
    views+=ModelViews
  )*
;

// Specification -------------------------------------

ElementKind:
  name=Id;

Tag:
  name=Id;

RelationshipKind:
  name=Id;

SpecificationRule:
  name='specification' '{'
    (elements+=SpecificationElementKind | tags+=SpecificationTag | relationships+=SpecificationRelationshipKind)*
  '}';

SpecificationElementKind:
  'element' kind=ElementKind ('{'
    style=StyleProperties?
  '}')?;

SpecificationTag:
  'tag' tag=Tag;

SpecificationRelationshipKind:
  'relationship' kind=RelationshipKind ('{'
    props+=RelationshipStyleProperty*
  '}')?
;

// Model -------------------------------------

Model:
  name='model' '{'
    elements+=(
      ExtendElement |
      ExplicitRelation |
      Element
    )*
  '}';

Element:
  (
    kind=[ElementKind] name=Id |
    name=Id Eq kind=[ElementKind]
  )
  (props+=String  // title
    (props+=String  // description
      (props+=String  // technology
        (props+=String)?   // tags
      )?
    )?
  )?
  ('{' body=ElementBody '}')?
;

ElementBody:
  tags=Tags?
  props+=ElementProperty*
  elements+=(
    Relation |
    Element
  )*
;

ElementProperty:
  ElementStringProperty | StyleProperties | LinkProperty;

ElementStringProperty:
  key=('title' | 'technology' | 'description') Colon? value=String SemiColon?;

ExtendElement:
  'extend' element=FqnElementRef '{'
    body=ExtendElementBody
  '}'
;

ExtendElementBody:
  elements+=(
    ExplicitRelation |
    Element
  )*
;

//
FqnElementRef:
  el=[Element] ({infer FqnElementRef.parent=current} Dot el=[Element])*;

ElementRef:
  el=[Element] ({infer ElementRef.parent=current} Dot el=[Element])*;

Tags:
  value+=[Tag:TagId] (Comma? value+=[Tag:TagId])* (Comma | SemiColon)?;

Relation:
  ExplicitRelation | ImplicitRelation;

fragment RelationFragment:
  ('->' | '-[' kind=[RelationshipKind] ']->')
  target=ElementRef
  title=String?
  tags=Tags?
  ('{' body=RelationBody '}')?
;

ImplicitRelation:
  ('this' | 'it')? RelationFragment;

ExplicitRelation:
  source=ElementRef RelationFragment;

RelationBody:
  tags=Tags?
  props+=RelationProperty*
;

RelationProperty:
  RelationStringProperty | RelationStyleProperty |  LinkProperty;

RelationStringProperty:
  key='title' Colon? value=String SemiColon?;

RelationStyleProperty:
  key='style' '{'
    props+=RelationshipStyleProperty*
  '}'
;


// Views -------------------------------------

ModelViews:
  name='views' '{'
    views+=ElementView*
  '}';

ElementView:
  'view' name=Id? (
    'extends' extends=ElementViewRef |
    'of' viewOf=ElementRef
  )?
  '{' body=ElementViewBody '}'
;

ElementViewRef:
  view=[ElementView];

ElementViewBody:
  tags=Tags?
  props+=ViewProperty*
  rules+=ViewRule*
;

ViewProperty:
  ViewStringProperty | LinkProperty
;

ViewStringProperty:
  key=('title' | 'description') Colon? value=String SemiColon?;

ViewLayoutDirection returns string:
  'TopBottom' | 'LeftRight' | 'BottomTop' | 'RightLeft';

ViewRule:
  ViewRulePredicate |
  ViewRuleStyle |
  ViewRuleAutoLayout
;

ViewRulePredicate:
  ({infer IncludePredicate} 'include' | {infer ExcludePredicate} 'exclude')
  expressions+=ViewRulePredicateExpr (Comma expressions+=ViewRulePredicateExpr)* Comma?
;

ViewRuleStyle:
  'style' targets+=ElementExpr (Comma targets+=ElementExpr)* Comma? '{'
    styleprops+=StyleProperty*
  '}';

ViewRuleAutoLayout:
  'autoLayout' direction=ViewLayoutDirection;

ViewRulePredicateExpr:
  InOutExpr |
  ElementExpr (
    {infer CustomElementExpr.target=current} 'with' '{' body=CustomElementExprBody '}' |
    {infer RelationExpr.source=current} (isBidirectional?='<->' | '->') target=ElementExpr |
    {infer OutgoingExpr.from=current} '->'
  )?
;

InOutExpr infers ViewRulePredicateExpr:
  IncomingExpr ({infer InOutExpr.inout=current} '->')?;

IncomingExpr:
  '->' to=ElementExpr;


ElementExpr:
  WildcardExpr |
  ElementSelectorExpr |
  DescedantsExpr
;

WildcardExpr:
  isWildcard?='*'
;

ElementSelectorExpr infers ElementExpr:
  'element' Dot (
    {infer ElementTagExpr} 'tag' IsEqual tag=[Tag:TagId] |
    {infer ElementKindExpr} 'kind' IsEqual kind=[ElementKind]
  )
;

DescedantsExpr infers ElementExpr:
  ElementRef (
    {infer ExpandElementExpr.parent=current} DotUnderscore |
    {infer DescedantsExpr.parent=current} DotWildcard
  )?
;

CustomElementExprBody:
  props+=(
    NavigateToProperty |
    ElementStringProperty |
    ColorProperty |
    ShapeProperty
  )*
;

NavigateToProperty:
  'navigateTo' value=ElementViewRef;

// Common -------------------------------------

LinkProperty:
  key='link' Colon? value=Uri SemiColon?;
IconProperty:
  key='icon' Colon? value=Uri SemiColon?;

ColorProperty:
  key='color' Colon? value=ThemeColor SemiColon?;
ShapeProperty:
  key='shape' Colon? value=ElementShape SemiColon?;

LineProperty:
  key='line' Colon? value=LineOptions SemiColon?;
ArrowProperty:
  key=('head' | 'tail') Colon? value=ArrowType SemiColon?;


StyleProperties:
  key='style' '{'
    StylePropertiesFragment
  '}';

StyleProperty:
  ColorProperty | ShapeProperty | IconProperty;

RelationshipStyleProperty:
  ColorProperty | LineProperty | ArrowProperty;

fragment StylePropertiesFragment:
  props+=StyleProperty*
;

// -------------------------
// Relationship Style Properties
LineOptions returns string:
  'solid' | 'dashed' | 'dotted';
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

ThemeColor returns string:
  'primary' | 'secondary' | 'muted' | 'slate' | 'blue' | 'indigo' | 'sky' | 'red' | 'gray' | 'green' | 'amber';
ElementShape returns string:
  'rectangle' | 'person' | 'browser' | 'mobile' | 'cylinder' | 'storage' | 'queue';
Uri returns string:
  URI_WITH_SCHEMA | URI_RELATIVE;

TagId returns string:
  TagHash Id;

Id returns string:
  IdTerminal | ElementShape | ThemeColor | ArrowType | LineOptions | 'element' | 'model';

fragment IsEqual:
  isEqual?=Eq | NotEqual;

// -----------------------------------
// Symbols
// terminal fragment HASH: '#';
terminal fragment UNDERSCORE: '_';
terminal fragment DASH: '-';
terminal fragment LETTER: /[^\W\d_]/;
terminal fragment DIGIT: /[0-9]/;
terminal fragment NEWLINE: /[\r?\n]/;
terminal fragment SPACE: /[^\S\r\n]/;

// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal WS: (NEWLINE | SPACE)+;

// -----------------------------------
// Terminals

terminal URI_WITH_SCHEMA: /\w+:\/\/\S+/;
terminal URI_RELATIVE: /\.{0,2}\/[^\/]\S+/;

terminal DotUnderscore: /\b\._/;
terminal DotWildcard: /\b\.\*/;
terminal TagHash: /\#\b/;
terminal Dot: /\b\./;
terminal NotEqual: /\!\={1,2}/;
terminal Eq: /\={1,2}/;
terminal Colon: ':';
terminal SemiColon: ';';
terminal Comma: ',';

terminal String: /"[^"]*"|'[^']*'/;

// terminal  TagId: HASH LETTER (LETTER | DIGIT | UNDERSCORE | DASH)*;
terminal IdTerminal: (LETTER | UNDERSCORE+ (LETTER | DIGIT)) (LETTER | DIGIT | UNDERSCORE | DASH)*;
