import { hash } from "@dfinity/agent"
import { IDL, toHexString } from "@dfinity/candid"
import { devtools } from "zustand/middleware"
import { createStore } from "zustand/vanilla"
import {
  ExtractFields,
  ExtractedServiceFields,
  ExtractedServiceDetails,
} from "./actor/candid"

import type { ActorSubclass, CanisterId, DefaultActorType } from "./actor/types"
import { ExtractDetails } from "./actor/candid/details"

interface StoreOptions {
  withDevtools?: boolean
  store: string
}

export function createStoreWithOptionalDevtools(
  initialState: any,
  options: StoreOptions
) {
  if (options.withDevtools) {
    return createStore(
      devtools(() => initialState, {
        name: "ReActor",
        store: options.store,
      })
    )
  } else {
    return createStore(() => initialState)
  }
}

export function extractServiceFields<
  A extends ActorSubclass<any> = DefaultActorType
>(
  idlFactory: IDL.InterfaceFactory,
  name: CanisterId
): ExtractedServiceFields<A> {
  const canisterId = typeof name === "string" ? name : name.toString()
  const methods = idlFactory({ IDL })

  const extractor = new ExtractFields<A>()

  return extractor.visitService(methods, canisterId)
}

export function extractServiceDetails<
  A extends ActorSubclass<any> = DefaultActorType
>(
  idlFactory: IDL.InterfaceFactory,
  name: CanisterId
): ExtractedServiceDetails<A> {
  const canisterId = typeof name === "string" ? name : name.toString()
  const methods = idlFactory({ IDL })

  const extractor = new ExtractDetails<A>()

  return extractor.visitService(methods, canisterId)
}

export const generateRequestHash = (args?: any[]) => {
  const serializedArgs = args
    ?.map((arg) => {
      if (typeof arg === "bigint") {
        return arg.toString()
      }

      return JSON.stringify(arg)
    })
    .join("|")

  return stringToHash(serializedArgs ?? "")
}

export const generateHash = (field?: any) => {
  const serializedArgs = JSON.stringify(field)
  return stringToHash(serializedArgs ?? "")
}

export const generateActorHash = (actor: ActorSubclass<any>) => {
  const serializedArgs = JSON.stringify(actor)
  return stringToHash(serializedArgs ?? "")
}

export const stringToHash = (str: string) => {
  const hashBytes = hash(new TextEncoder().encode(str))
  return `0x${toHexString(hashBytes)}` as `0x${string}`
}
