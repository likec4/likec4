import "./like-c4.model"
import "./like-c4.common"

ModelViews:
  name='views' OpenBlock
    views+=View*
  CloseBlock;

View:
  {infer ElementView} 'view' name=Name? ('of' viewOf=ElementRef)? OpenBlock
    properties+=ViewProperty*
    rules+=ViewRule*
  CloseBlock;

ViewProperty:
  key=('title' | 'description') Colon? value=STRING;

ViewRule:
  ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout;

ViewRuleExpression:
  (isInclude?='include' | 'exclude') expressions+=Expression (Comma expressions+=Expression)*;

ViewRuleLayoutDirection returns string: 'TB' | 'LR' | 'BT' | 'RL';

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
  {infer IncomingExpression} '->' target=ElementExpression (
    {infer InOutExpression.inout=current} '->'
  )? |
  ElementExpression (
    {infer RelationExpression.source=current} '->' target=ElementExpression |
    {infer OutgoingExpression.source=current} '->'
  )?
;

ElementExpression:
  {infer WildcardExpression} isWildcard?='*' |
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


// fragment IsEqual:
//   (isEqual?=EQ | NotEQ);
