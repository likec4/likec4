import { type Mock, vi } from 'vitest'

type Method = (...args: any[]) => any
type MethodKeys<T> = { [K in keyof T]-?: T[K] extends Method ? K : never }[keyof T]

/**
 * Replaces a method of a per-test object (for example a language service) with a `vi.fn` mock.
 *
 * Use this instead of `vi.spyOn` for objects that belong to test language services.
 * Vitest keeps every mock in a global registry for the lifetime of the worker, and a spy
 * references its target (restore closure, recorded `this`), so with `isolate: false`
 * a spy on a service retains the whole services graph.
 * The mock returned here is called through a wrapper and never references `target`.
 *
 * The `implementation` must not capture `target` or the services either.
 */
export function mockMethod<T extends object, K extends MethodKeys<T>>(
  target: T,
  key: K,
  implementation?: Extract<T[K], Method>,
): Mock<Extract<T[K], Method>> {
  const mock = vi.fn<Extract<T[K], Method>>(implementation)
  const wrapper: Method = (...args) => mock(...args)
  Reflect.set(target, key, wrapper)
  return mock
}
