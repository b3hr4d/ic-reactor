import { hash, hashValue, toHex } from "@dfinity/agent"
import { DevtoolsOptions, devtools } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

import type { BaseActor, CandidDefenition, IDL } from "../types"

export function createStoreWithOptionalDevtools<T>(
  initialState: T,
  config: DevtoolsOptions
) {
  if (config.withDevtools) {
    return createStore(
      devtools(() => initialState, {
        serialize: {
          replacer: (_: string, value: unknown) =>
            typeof value === "bigint" ? value.toString() : value,
        },
        ...config,
      })
    )
  } else {
    return createStore(() => initialState)
  }
}

export const importCandidDefinition = async (
  candidDef: string
): Promise<CandidDefenition> => {
  const blob = new Blob([candidDef], { type: "application/javascript" })
  const url = URL.createObjectURL(blob)

  try {
    const module = await import(/* @vite-ignore */ url)
    URL.revokeObjectURL(url) // Ensure URL is revoked after import
    return module.default
  } catch (error) {
    URL.revokeObjectURL(url) // Ensure URL is revoked in case of error
    throw new Error("Error importing Candid definition")
  }
}

export const isInLocalOrDevelopment = () => {
  return typeof process !== "undefined" && process.env.DFX_NETWORK === "local"
}

export const getProcessEnvNetwork = () => {
  if (typeof process === "undefined") return "ic"
  else return process.env.DFX_NETWORK ?? "ic"
}

export function isQuery(func: IDL.FuncClass): boolean {
  return (
    func.annotations.includes("query") ||
    func.annotations.includes("composite_query")
  )
}

export const jsonToString = (json: unknown, space = 2) => {
  return JSON.stringify(
    json,
    (_, value) => (typeof value === "bigint" ? `BigInt(${value})` : value),
    space
  )
}

export const generateRequestHash = (args: unknown[] = []): `0x${string}` => {
  const serializedArgs = hashValue(args)

  return `0x${toHex(serializedArgs)}`
}

export const generateHash = (field?: unknown) => {
  const serializedArgs = JSON.stringify(field)
  return stringToHash(serializedArgs ?? "")
}

export const generateActorHash = (actor: BaseActor) => {
  const serializedArgs = JSON.stringify(actor)
  return stringToHash(serializedArgs ?? "")
}

export const stringToHash = (str: string) => {
  const hashBytes = hash(new TextEncoder().encode(str))
  return `0x${toHexString(hashBytes)}` as `0x${string}`
}

function toHexString(bytes: ArrayBuffer) {
  return toHex(bytes)
}
