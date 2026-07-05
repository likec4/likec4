import type { ActorRefFromLogic, AnyActorLogic } from 'xstate'

/**
 * Helper function to define actors for use to mimize type inference issues
 * with XState ActorSystem
 *
 * @see {@link ../editor/actor/setup.ts}
 */
export function defineActors<A extends Record<string, AnyActorLogic>>(actors: A): A {
  return actors
}

export type inferChildrenNames<A> = A extends Record<string, AnyActorLogic> ? {
    [K in keyof A & string]: K
  } :
  never

export type inferChildrenRef<A> = A extends Record<string, AnyActorLogic> ? {
    [K in keyof A & string]: ActorRefFromLogic<A[K]> | undefined
  } :
  never

export type inferProvidedActor<A> = A extends Record<string, AnyActorLogic> ? {
    [K in keyof A & string]: {
      id: K
      logic: A[K]
      src: K
    }
  }[keyof A & string] :
  never
