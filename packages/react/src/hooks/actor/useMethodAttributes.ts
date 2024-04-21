import { ActorHooks } from "./hooks"

import type { BaseActor } from "@src/types"

/**
 * Hook for accessing the method attributes of an actor.
 *
 * @returns An array of method attributes for the actor.
 */
export const useMethodAttributes = <A = BaseActor>() =>
  ActorHooks.useMethodAttributes<A>()
