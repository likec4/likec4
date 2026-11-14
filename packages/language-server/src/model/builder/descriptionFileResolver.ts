import type { MarkdownOrString } from '@likec4/core/types'
import type { DescriptionFileRef, WithDescriptionFile } from '../../ast'
import type { LikeC4Services } from '../../module'

export type WithDescription = WithDescriptionFile & {
  description?: MarkdownOrString | null | undefined
}

/**
 * Resolves the content of a file referenced with `descriptionFile`,
 * `undefined` when the file cannot be read (the validation reports it)
 */
export type DescriptionFileResolver = (ref: DescriptionFileRef | undefined) => { md: string } | undefined

export function createDescriptionFileResolver(services: LikeC4Services): DescriptionFileResolver {
  return (ref: DescriptionFileRef | undefined) => {
    return services.likec4.DescriptionFiles.readMarkdown(ref?.uri)
  }
}
