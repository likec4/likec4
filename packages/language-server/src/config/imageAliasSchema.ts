import * as v from 'valibot'

// Key must be prefixed with "@" and contain only allowed characters
const IMAGE_ALIAS_KEY_REGEX = /^@[A-Za-z0-9_-]*$/
// Relative path (no leading slash, drive letter, or protocol)
const IMAGE_ALIAS_VALUE_REGEX = /^(?!\/|[A-Za-z]:[\\\/])(?!.*:\/\/).*$/

// Schema for an image alias value: must be a non-empty string representing a relative path (no leading slash, drive letter, or protocol).
const ImageAliasValue = v.pipe(
  v.string(),
  v.regex(
    IMAGE_ALIAS_VALUE_REGEX,
    'Image alias value must be a relative path (no leading slash or protocol)',
  ),
  v.nonEmpty('Image alias value cannot be empty'),
)

export const ImageAliasesSchema = v.pipe(
  v.record(
    v.string(), // PLAIN key schema - valibot JSON schema export-safe.
    ImageAliasValue,
  ),
  v.description(
    'Map of image alias prefixes to relative paths (keys must match /^@[A-Za-z0-9_-]*$/; values must be relative paths without protocol or leading slash).',
  ),
)

// This just allows us to have a typed validate function.
type ImageAliasConfig = v.InferOutput<typeof ImageAliasesSchema>

export function validateImageAliases(imageAliases?: ImageAliasConfig) {
  const invalidKeys: string[] = []
  const invalidValues: string[] = []

  if (imageAliases) {
    for (const [key, value] of Object.entries(imageAliases)) {
      if (!IMAGE_ALIAS_KEY_REGEX.test(key)) {
        invalidKeys.push(key)
      }
      // Value regex is technically already enforced by Valibot,
      // so this check is purely defensive.
      if (!IMAGE_ALIAS_VALUE_REGEX.test(value)) {
        invalidValues.push(`${key} -> ${value}`)
      }
    }
  }

  if (invalidKeys.length || invalidValues.length) {
    const parts: string[] = []
    if (invalidKeys.length) {
      parts.push(
        `Invalid image alias key(s): ${
          invalidKeys
            .map((k) => JSON.stringify(k))
            .join(', ')
        } (must match ${IMAGE_ALIAS_KEY_REGEX})`,
      )
    }
    if (invalidValues.length) {
      parts.push(
        `Invalid image alias value(s): ${
          invalidValues
            .map((kv) => JSON.stringify(kv))
            .join(', ')
        } (must match ${IMAGE_ALIAS_VALUE_REGEX})`,
      )
    }

    throw new Error(parts.join(' | '))
  }
}
