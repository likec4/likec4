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
    name=Name Eq kind=[ElementKind:Name] (title=STRING)?
  ) definition=ElementBody?;

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
  'extend' element=StrictElementRef (OpenBlock
    elements+=(
      Element |
      RelationWithSource
    )*
  CloseBlock)?;

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
;

RelationWithoutSource infers Relation:
  ('this' | 'it')? '->' RelationFragment;

RelationWithSource:
  source=ElementRef '->' RelationFragment;

// RelationWithSource: {infer RelationWithSource2} RelationWithSourceRule;
