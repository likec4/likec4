export interface SpecAux<
  ElementKind,
  DeploymentKind,
  RelationKind,
  Tag,
  MetadataKey,
> {
  ElementKind: ElementKind
  DeploymentKind: DeploymentKind
  RelationKind: RelationKind
  Tag: Tag
  MetadataKey: MetadataKey
}

export type AnySpecAux = SpecAux<string, string, string, string, string>

/**
 * Auxilary type to keep track
 */
export interface TypeAux<
  Element,
  Deployment,
  View,
  Spec extends AnySpecAux,
> {
  Spec: Spec
  Element: Element
  Deployment: Deployment
  View: View

  ElementKind: Spec['ElementKind']
  DeploymentKind: Spec['DeploymentKind']
  RelationKind: Spec['RelationKind']
  Tag: Spec['Tag']
  MetadataKey: Spec['MetadataKey']
  // // Wrapped Element
  // // If Fqn is just a string, then we use generic Fqn to have better hints in the editor
  // Fqn: IsStringLiteral<Element> extends true ? Fqn<Element> : Fqn
  // ElementOrFqn: Element | WithId<this['Fqn']>

  // // Wrapped Deployment
  // DeploymentFqn: IsStringLiteral<Deployment> extends true ? Fqn<Deployment> : Fqn
  // DeploymentOrFqn: Deployment | WithId<this['DeploymentFqn']>

  // // Wrapped View
  // ViewId: IsStringLiteral<View> extends true ? ViewId<View> : ViewId

  // ViewType: ViewType

  // RelationId: RelationId
  // NodeId: NodeId
  // NodeIdLiteral: string
  // EdgeId: EdgeId
  // EdgeIdLiteral: string

  // NodeOrId: LiteralUnion<this['NodeIdLiteral'], string> | WithId<this['NodeId']>
  // EdgeOrId: LiteralUnion<this['EdgeIdLiteral'], string> | WithId<this['EdgeId']>

  // Model: Simplify<Omit<GenericLikeC4ModelData, 'views'> & WithViews<this['ViewId'], ViewType>>
}

export type AnyTypes = TypeAux<string, string, string, AnySpecAux>
