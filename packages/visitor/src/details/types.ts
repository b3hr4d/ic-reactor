import { BaseActor, FunctionName, FunctionType, IDL } from "@ic-reactor/core"
import { FieldType } from "../types"

export type FunctionCategory = "home" | "wallet" | "governance" | "setting"

export interface ExtractedServiceDetails<A = BaseActor> {
  canisterId: string
  description: string
  methodDetails: ServiceDetails<A>
}

export type ServiceDetails<A = BaseActor> = {
  [K in FunctionName<A>]: <
    ExtractorClass extends IDL.Visitor<unknown, unknown>
  >(
    extractorClass?: ExtractorClass
  ) => MethodDetails<A>
}

export type MethodDetails<A = BaseActor> = {
  functionType: FunctionType
  functionName: FunctionName<A>
  category: FunctionCategory
  order: number
  __label: string
  __description: string
  [key: `arg${number}`]: FieldDetailsWithChild
}

export interface FieldDetails {
  __label: string
  __type: FieldType
  __description: string
  [key: string]: string | boolean | undefined
}

export interface InputDetails extends FieldDetails {
  __checked?: boolean
  [key: string]: string | boolean | undefined
}

export type OtherDetails =
  | FieldDetails
  | FieldDetailsWithChild
  | FieldDetailsWithChild[]
  | FieldDetails[]

export interface FieldDetailsWithChild {
  __hidden?: boolean
  __checked?: boolean
  __label: string
  __type: FieldType
  __description: string
  optional?: OtherDetails
  vector?: OtherDetails
  [key: string]: string | boolean | undefined | OtherDetails
}
