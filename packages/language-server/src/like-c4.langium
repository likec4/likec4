grammar LikeC4

entry LikeC4Grammar:
  (
    specifications+=SpecificationRule |
    models+=Model  |
    views+=ModelViews |
    likec4lib+=LikeC4Lib
  )*
;

// Lib -------------------------------------
LikeC4Lib:
  'likec4lib' '{'
    'icons' '{'
      (icons+=LibIcon)+
    '}'
  '}';

LibIcon:
  name=ICON_ID;

// Specification -------------------------------------

ElementKind:
  name=Id;

Tag:
  name=Id;

RelationshipKind:
  name=Id;

SpecificationRule:
  name='specification' '{'
    (
      elements+=SpecificationElementKind |
      tags+=SpecificationTag |
      relationships+=SpecificationRelationshipKind
    )*
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
  '}'
;

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
  body=ElementBody?
;

ElementBody: '{'
  tags=Tags?
  props+=ElementProperty*
  elements+=(
    Relation |
    Element
  )*
'}'
;

ElementProperty:
  ElementStringProperty | StyleProperties | LinkProperty | IconProperty;

ElementStringProperty:
  key=('title' | 'technology' | 'description') ':'? value=String ';'?;

ExtendElement:
  'extend' element=FqnElementRef body=ExtendElementBody
;

ExtendElementBody:  '{'
  elements+=(
    ExplicitRelation |
    Element
  )*
'}'
;

//
FqnElementRef:
  el=[Element] ({infer FqnElementRef.parent=current} dot=StickyDot el=[Element])*;

ElementRef:
  el=[Element] ({infer ElementRef.parent=current} dot=StickyDot el=[Element])*;

Tags:
  value+=[Tag:TagId] (','? value+=[Tag:TagId])* (';')?
;

Relation:
  ExplicitRelation | ImplicitRelation;

fragment RelationFragment:
  ('->' | '-[' kind=[RelationshipKind] ']->' | kind=[RelationshipKind:DotId] )
  target=ElementRef
  title=String?
  tags=Tags?
  body=RelationBody?
;

ExplicitRelation:
  source=ElementRef RelationFragment;

ImplicitRelation:
  ('this' | 'it')? RelationFragment;

RelationBody: '{'
  tags=Tags?
  props+=RelationProperty*
'}'
;

RelationProperty:
  RelationStringProperty | RelationStyleProperty |  LinkProperty;

RelationStringProperty:
  key='title' ':'? value=String ';'?;

RelationStyleProperty:
  key='style' '{'
    props+=RelationshipStyleProperty*
  '}'
;


// Views -------------------------------------

ModelViews:
  name='views' '{'
    views+=(
      DynamicView |
      ElementView
    )*
  '}';

type LikeC4View = ElementView | DynamicView;

ElementView:
  'view' name=Id? (
    'extends' extends=ElementViewRef |
    'of' viewOf=ElementRef
  )?
  body=ElementViewBody
;

DynamicView:
  'dynamic' 'view' name=Id body=DynamicViewBody
;

ViewRef:
  view=[LikeC4View];

ElementViewRef:
  view=[ElementView];

ElementViewBody: '{'
  tags=Tags?
  props+=ViewProperty*
  rules+=ViewRule*
'}'
;

DynamicViewBody: '{'
  tags=Tags?
  props+=ViewProperty*
  (steps+=DynamicViewStep | rules+=DynamicViewRule)*
  '}'
;


type StringProperty = ElementStringProperty| ViewStringProperty | RelationStringProperty;

ViewProperty:
  ViewStringProperty | LinkProperty
;

ViewStringProperty:
  key=('title' | 'description') ':'? value=String ';'?;

ViewLayoutDirection returns string:
  'TopBottom' | 'LeftRight' | 'BottomTop' | 'RightLeft';

ViewRule:
  ViewRulePredicate |
  ViewRuleStyle |
  ViewRuleAutoLayout
;

DynamicViewRule:
  DynamicViewRulePredicate |
  ViewRuleStyle |
  ViewRuleAutoLayout
;

DynamicViewStep:
  source=ElementRef (isBackward?='<-' |  '->' | '-[' kind=[RelationshipKind] ']->' | kind=[RelationshipKind:DotId] ) target=ElementRef title=String?
;

ViewRulePredicate:
  {infer IncludePredicate} 'include' exprs=Expressions |
  {infer ExcludePredicate} 'exclude' exprs=Expressions
;

// IncludePredicate:
//   'include' expr=WithExpressions ({infer IncludePredicate.prev=current} ',' (expr=WithExpressions)?)*
// ;
// ExcludePredicate:
//   'exclude' expr=WithExpressions ({infer ExcludePredicate.prev=current} ',' (expr=WithExpressions)?)*
// ;

Expressions:
  value=WithExpressions ({infer Expressions.prev=current} ',' (value=WithExpressions)?)*
;

WithExpressions infers Expression:
  RelationExpression ({infer CustomRelationExpression.relation=current} 'with' custom=CustomRelationProperties)? |
  ElementExpression ({infer CustomElementExpression.target=current} 'with' custom=CustomElementProperties)?
;

ElementExpression:
  ElementSelectorExpression |
  ElementDescedantsExpression
;

ElementSelectorExpression infers ElementExpression:
  {infer WildcardExpression} isWildcard?='*' |
  {infer ElementTagExpression} 'element.tag' IsEqual tag=[Tag:TagId]? |
  {infer ElementKindExpression} 'element.kind' IsEqual kind=[ElementKind]?
;

ElementDescedantsExpression infers ElementExpression:
  ElementRef (
    {infer ExpandElementExpression.expand=current} DotUnderscore |
    {infer ElementDescedantsExpression.parent=current} DotWildcard
  )?
;

RelationExpression:
  InOutRelationExpressions |
  DirectedRelationExpressions
;

InOutRelationExpressions infers RelationExpression:
  IncomingRelationExpression ({infer InOutRelationExpression.inout=current} '->')?
;

IncomingRelationExpression:
  '->' to=ElementExpression;

DirectedRelationExpressions infers RelationExpression:
  OutgoingRelationExpression ({infer DirectedRelationExpression.source=current} target=ElementExpression)?
;

OutgoingRelationExpression:
  from=ElementExpression
  (isBidirectional?='<->' | '->' | '-[' kind=[RelationshipKind] ']->' | kind=[RelationshipKind:DotId])
;

// Comma-separated list of ElementExpressions
ElementExpressionsIterator:
  value=ElementExpression ({infer ElementExpressionsIterator.prev=current} ',' (value=ElementExpression)?)*
;

DynamicViewRulePredicate:
  'include' exprs=DynamicViewRulePredicateIterator
;

DynamicViewRulePredicateIterator:
  value=DynamicViewElementExpressions ({infer DynamicViewRulePredicateIterator.prev=current} ',' (value=DynamicViewElementExpressions)?)*
;

DynamicViewElementExpressions infers DynamicViewElementExpression:
  ElementExpression ({infer CustomElementExpression.target=current} 'with' custom=CustomElementProperties)?
;

ViewRuleStyle:
  'style' target=ElementExpressionsIterator '{'
    props+=StyleProperty*
  '}';

ViewRuleAutoLayout:
  'autoLayout' direction=ViewLayoutDirection;

CustomElementProperties: '{'
  props+=(
    NavigateToProperty |
    ElementStringProperty |
    StyleProperty
  )*
'}'
;

CustomRelationProperties: '{'
  props+=(
    RelationStringProperty |
    RelationshipStyleProperty
  )*
'}'
;

NavigateToProperty:
  key='navigateTo' value=ViewRef;

// Common properties -------------------------------------

LinkProperty:
  key='link' ':'? value=Uri ';'?;
ColorProperty:
  key='color' ':'? value=ThemeColor ';'?;

OpacityProperty:
  key='opacity' ':'? value=Percent ';'?;

// Element properties -------------------------------------
IconProperty:
  key='icon' ':'? (libicon=[LibIcon:IconId] | value=Uri) ';'?;

ShapeProperty:
  key='shape' ':'? value=ElementShape ';'?;


BorderStyleValue returns string:
  LineOptions | 'none';

BorderProperty:
  key='border' ':'? value=BorderStyleValue ';'?;

StyleProperty:
  ColorProperty |
  ShapeProperty |
  BorderProperty |
  OpacityProperty |
  IconProperty;

StyleProperties:
  key='style' '{'
    props+=StyleProperty*
  '}';


// -------------------------
// Relationship Style Properties
LineProperty:
  key='line' ':'? value=LineOptions ';'?;
ArrowProperty:
  key=('head' | 'tail') ':'? value=ArrowType ';'?;

RelationshipStyleProperty:
  ColorProperty | LineProperty | ArrowProperty;

LineOptions returns string:
  'solid' |
  'dashed' |
  'dotted'
;

ArrowType returns string:
  'none' |
  'normal' |
  'onormal' |
  'dot' |
  'odot' |
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

IconId returns string:
  ICON_ID;

Uri returns string:
  URI_WITH_SCHEMA | URI_RELATIVE;

// Percent returns string: PERCENT;

TagId returns string:
  Hash Id;

DotId returns string:
  Dot Id;

Id returns string:
  IdTerminal | ElementShape | ThemeColor | ArrowType | LineOptions | 'element' | 'model';

fragment IsEqual:
  isEqual?=Eq | NotEqual;

// -----------------------------------
// Symbols
// terminal fragment HASH: '#';
// terminal fragment UNDERSCORE: '_';
// terminal fragment DASH: '-';
// terminal fragment LETTER: /[^\W\d_]/;
// terminal fragment DIGIT: /[0-9]/;
// terminal fragment NEWLINE: /[\r?\n]/;
// terminal fragment SPACE: /[^\S\r\n]/;

// -------------------------
// Comments
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal WS: /\s+/;

// -----------------------------------
// Terminals
//terminal LineStartWithDash: /(?<=([\r?\n][^\S\r\n]*))-/;

// LibIcons
terminal ICON_ID: /(aws|gcp|tech):[_-\w\d]+/;

terminal URI_WITH_SCHEMA: /\w+:\/\/\S+/;
terminal URI_RELATIVE: /\.{0,2}\/[^\/]\S+/;

terminal DotUnderscore: /\b\._/;
terminal DotWildcard: /\b\.\*/;
terminal Hash: '#';

// No space allowed before dot
terminal StickyDot: /\b\./;
terminal Dot: '.';
terminal NotEqual: /\!\={1,2}/;
terminal Eq: /\={1,2}/;
terminal Percent: /\b\d+%/;

terminal String: /"[^"]*"|'[^']*'/;

// terminal  TagId: HASH LETTER (LETTER | DIGIT | UNDERSCORE | DASH)*;
// terminal IdTerminal: (LETTER | UNDERSCORE+ (LETTER | DIGIT)) (LETTER | DIGIT | UNDERSCORE | DASH)*;
terminal IdTerminal:  /\b[_]*[a-zA-Z][_-\w]*/;
