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
  elements+=(
    Element |
    Relation
  )*
CloseBlock;

ExtendElement:
  'extend' element=StrictElementRef (OpenBlock
    elements+=(
      Element |
      RelationWithSource
    )*
  CloseBlock)?;

StrictElementRef:
  el=[Element:Name] (Dot child=StrictElementChildRef)?;

StrictElementChildRef:
  el=[Element:Name] (Dot child=StrictElementChildRef)?;

ElementRef:
  el=[Element:Name] (Dot next=ElementDescendantRef)?;

ElementDescendantRef:
  el=[Element:Name] (Dot next=ElementDescendantRef)?;

Tags:
  value+=[Tag:TagID];

Relation: RelationWithSource | RelationWithoutSource;

fragment RelationFragment:
  target=ElementRef
  (title=STRING)?
;

RelationWithoutSource infers Relation:
  ('this' | 'it')? LArrow RelationFragment;

RelationWithSource:
  source=ElementRef LArrow RelationFragment;

// RelationWithSource: {infer RelationWithSource2} RelationWithSourceRule;
