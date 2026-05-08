/**
 * Casts a partial object to a full object type, mostly for tests.
 * Motivation: to avoid using `as` in the code
 */
export function unsafePartial<T>(value: Partial<NoInfer<T>>): T {
  return value as T
}
