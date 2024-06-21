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
  ElementStringProperty | StyleProperties | LinkProperty;

ElementStringProperty:
  key=('title' | 'technology' | 'description') Colon? value=String SemiColon?;

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
  (value+=[Tag:TagId] comma+=(Comma | SemiColon)?)+
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
  key='title' Colon? value=String SemiColon?;

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

DynamicViewBody: '{'
  tags=Tags?
  props+=ViewProperty*
  (steps+=DynamicViewStep | rules+=DynamicViewRule)*
  '}'
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

type StringProperty = ElementStringProperty| ViewStringProperty;

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

DynamicViewRule:
  DynamicViewRulePredicate |
  ViewRuleStyle |
  ViewRuleAutoLayout
;

DynamicViewStep:
  source=ElementRef (isBackward?='<-' |  '->' | '-[' kind=[RelationshipKind] ']->') target=ElementRef title=String?
;

ViewRulePredicate:
  ({infer IncludePredicate} 'include' | {infer ExcludePredicate} 'exclude')
  expressions+=ViewRulePredicateExpr (commas+=Comma expressions+=ViewRulePredicateExpr)* Comma?
;

DynamicViewRulePredicate:
  'include' expressions+=ViewRulePredicateExpr (commas+=Comma expressions+=ViewRulePredicateExpr)* Comma?
;

ViewRuleStyle:
  'style' targets+=ElementExpr (commas+=Comma targets+=ElementExpr)* Comma? '{'
    styleprops+=StyleProperty*
  '}';

ViewRuleAutoLayout:
  'autoLayout' direction=ViewLayoutDirection;

ViewRulePredicateExpr:
  InOutExpr |
  ElementExpr (
    {infer CustomElementExpr.target=current} 'with'  body=CustomElementExprBody |
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
  'element' StickyDot (
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

CustomElementExprBody: '{'
  props+=(
    NavigateToProperty |
    ElementStringProperty |
    StyleProperty
  )*
'}'
;

NavigateToProperty:
  key='navigateTo' value=ViewRef;

// Common properties -------------------------------------

LinkProperty:
  key='link' Colon? value=Uri SemiColon?;
ColorProperty:
  key='color' Colon? value=ThemeColor SemiColon?;

OpacityProperty:
  key='opacity' Colon? value=Percent SemiColon?;

// Element properties -------------------------------------
IconProperty:
  key='icon' Colon? value=Uri SemiColon?;

ShapeProperty:
  key='shape' Colon? value=ElementShape SemiColon?;


BorderStyleValue returns string:
  LineOptions | 'none';

BorderProperty:
  key='border' Colon? value=BorderStyleValue SemiColon?;

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
  key='line' Colon? value=LineOptions SemiColon?;
ArrowProperty:
  key=('head' | 'tail') Colon? value=ArrowType SemiColon?;

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
terminal Colon: ':';
terminal SemiColon: ';';
terminal Comma: ',';
terminal Percent: /\b\d+%/;

terminal String: /"[^"]*"|'[^']*'/;

// terminal  TagId: HASH LETTER (LETTER | DIGIT | UNDERSCORE | DASH)*;
// terminal IdTerminal: (LETTER | UNDERSCORE+ (LETTER | DIGIT)) (LETTER | DIGIT | UNDERSCORE | DASH)*;
terminal IdTerminal:  /\b[_]*[a-zA-Z][_-\w]*/;
