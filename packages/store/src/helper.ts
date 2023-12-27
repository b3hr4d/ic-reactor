import { Actor, hash } from "@dfinity/agent"
import { toHexString } from "@dfinity/candid"
import { FuncClass } from "@dfinity/candid/lib/cjs/idl"
import { devtools } from "zustand/middleware"
import { createStore } from "zustand/vanilla"
import {
  ActorSubclass,
  ExtractReActorMethodArgs,
  ReActorMethodField,
  ReActorMethodStates,
} from "./types"
import { ExtractedField, UIExtract } from "./candid"

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

export function extractMethodField<A extends ActorSubclass<any>>(
  actor: A
): ReActorMethodField<A, keyof A & string>[] {
  type M = keyof A & string
  const methods = Actor.interfaceOf(actor as Actor)._fields as [M, FuncClass][]

  const allFunction = methods.map(([functionName, method]) => {
    return method.argTypes.reduce(
      (acc, argType, index) => {
        const field = argType.accept(new UIExtract(), argType.name)
        acc.fields.push(field)
        acc.defaultValues[`${functionName}-arg${index}`] = field.defaultValues
        acc.functionName = functionName
        return acc
      },
      {
        fields: [] as ExtractedField[],
        defaultValues: {} as { [K in `${M}-arg${number}`]?: any },
        functionName: "" as M,
      }
    ) as ReActorMethodField<A, M>
  })

  return allFunction
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
