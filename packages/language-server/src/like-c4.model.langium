import "./like-c4.common"

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
  (props+=ElementProperty)*

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

ExtendElement:
  'extend' element=StrictElementRef OpenBlock
    body=ExtendElementBody
  CloseBlock;

ExtendElementBody:
  elements+=(
    Element |
    RelationWithSource
  )*;

StrictElementRef:
  el=[Element:Name] (Dot next=StrictElementRef)?;

ElementRef:
  el=[Element:Name] (Dot next=ElementRef)?;

Tags:
  value+=[Tag:TagID];

Relation: RelationWithSource | RelationWithoutSource;

fragment RelationFragment:
  target=ElementRef
  (title=STRING)?
  definition=RelationBody?
;

RelationWithoutSource infers Relation:
  ('this' | 'it')? '->' RelationFragment;

RelationWithSource:
  source=ElementRef '->' RelationFragment;

// RelationWithSource: {infer RelationWithSource2} RelationWithSourceRule;

RelationBody: OpenBlock
  tags=Tags?
  (props+=RelationProperty)*
CloseBlock;

RelationProperty:
  key=('title') Colon? value=STRING;
