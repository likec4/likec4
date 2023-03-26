import "./like-c4.common"

SpecificationRule:
  name='specification' OpenBlock
  (
    elementKinds+=SpecificationElementKind |
    tags+=SpecificationTag
  )*
  CloseBlock;

SpecificationElementKind:
  'element' kind=ElementKind (OpenBlock
     style=ElementStyleProperties?
  CloseBlock)?;

SpecificationTag:
  'tag' tag=Tag;
