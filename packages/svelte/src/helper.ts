import { Actor, hash } from "@dfinity/agent"
import { toHexString } from "@dfinity/candid"
import { FuncClass } from "@dfinity/candid/lib/cjs/idl"
import { ActorSubclass, ReActorState } from "./types"

export function createActorStates<A extends ActorSubclass<any>>(
  actor: A
): ReActorState<A>["actorState"] {
  const actorState = {} as ReActorState<A>["actorState"]
  const methods: [string, FuncClass][] = Actor.interfaceOf(
    actor as Actor
  )._fields

  for (const [method, types] of methods) {
    actorState[method as keyof A] = {
      types,
      states: {},
    }
  }

  return actorState
}

export const generateRequestHash = (args?: any[]) => {
  const serializedArgs = args
    ?.map((arg) => {
      if (typeof arg === "bigint") {
        return arg.toString()
      }
      // Add more conditions for other special types
      return JSON.stringify(arg)
    })
    .join("|")

  const hashBytes = hash(new TextEncoder().encode(serializedArgs ?? ""))
  return toHexString(hashBytes)
}
