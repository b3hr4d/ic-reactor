export * from "./agent/types"
export * from "./actor/types"
export * from "./candid/types"

import { NamedSet } from "zustand/middleware"
import type { StoreApi } from "zustand"

export interface StoreApiWithDevtools<T> extends StoreApi<T> {
  setState: NamedSet<T>
}
