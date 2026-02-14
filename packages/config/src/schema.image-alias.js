import z from 'zod/v4';
// Key must be prefixed with "@" and contain only allowed characters
const IMAGE_ALIAS_KEY_REGEX = /^@[A-Za-z0-9_-]*$/;
// Relative path (no leading slash, drive letter, or protocol)
const IMAGE_ALIAS_VALUE_REGEX = /^(?!\/|[A-Za-z]:[\\\/])(?!.*:\/\/).*$/;
const ImageAliasKey = z
    .string()
    .min(1, 'Image alias key cannot be empty')
    .regex(IMAGE_ALIAS_KEY_REGEX, 'Image alias key must match /^@\\w+$/');
// Schema for an image alias value: must be a non-empty string representing a relative path (no leading slash, drive letter, or protocol).
const ImageAliasValue = z
    .string()
    .min(1, 'Image alias value cannot be empty')
    .regex(IMAGE_ALIAS_VALUE_REGEX, 'Image alias value must be a relative path (no leading slash or protocol)');
export const ImageAliasesSchema = z.record(ImageAliasKey, // PLAIN key schema - zod JSON schema export-safe.
ImageAliasValue).meta({
    id: 'ImageAliases',
    description: 'Map of image alias prefixes to relative paths (keys must match /^@\\w+$/; values must be relative paths without protocol or leading slash).',
});
