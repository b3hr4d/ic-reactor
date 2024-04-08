import type {
  FieldDetailsWithChild,
  ServiceDetails,
  FieldDetails,
  MethodDetails,
  InputDetails,
} from "./types"
import { IDL } from "@dfinity/candid"
import { isQuery } from "../helper"
import { BaseActor, FunctionName } from "@ic-reactor/core/dist/types"

/**
 * Visit the candid file and extract the details.
 * It returns the extracted service details.
 *
 */
export class VisitDetails<A = BaseActor> extends IDL.Visitor<
  string,
  MethodDetails<A> | FieldDetailsWithChild | FieldDetails | ServiceDetails<A>
> {
  public counter = 0

  public visitFunc<M extends FunctionName<A>>(
    t: IDL.FuncClass,
    functionName: M
  ): MethodDetails<A> {
    const functionType = isQuery(t) ? "query" : "update"

    const argFields = t.argTypes.reduce((acc, arg, index) => {
      acc[`arg${index}`] = arg.accept(
        this,
        `__arg${index}`
      ) as FieldDetailsWithChild

      return acc
    }, {} as Record<`arg${number}`, FieldDetailsWithChild | FieldDetails>)

    const retFields = t.retTypes.reduce((acc, ret, index) => {
      acc[`ret${index}`] = ret.accept(
        this,
        `__ret${index}`
      ) as FieldDetailsWithChild

      return acc
    }, {} as Record<`ret${number}`, FieldDetailsWithChild | FieldDetails>)

    this.counter++

    return {
      functionName,
      functionType,
      __label: functionName,
      args: argFields,
      rets: retFields,
    }
  }

  public visitRecord(
    _t: IDL.RecordClass,
    _fields: Array<[string, IDL.Type]>,
    __label: string
  ): FieldDetailsWithChild {
    const fields = _fields.reduce((acc, [key, type]) => {
      const details = type.accept(this, key) as FieldDetailsWithChild

      acc[key] = details

      return acc
    }, {} as Record<string, FieldDetailsWithChild | FieldDetails>)

    return {
      __label,
      __hidden: /^__arg|^__ret/.test(__label),
      ...fields,
    }
  }

  public visitVariant(
    _t: IDL.VariantClass,
    _fields: Array<[string, IDL.Type]>,
    __label: string
  ): FieldDetailsWithChild {
    const fields = _fields.reduce((acc, [key, type]) => {
      const details = type.accept(this, key) as FieldDetailsWithChild
      acc[key] = details

      return acc
    }, {} as Record<string, FieldDetailsWithChild | FieldDetails>)

    return {
      __label,
      ...fields,
    }
  }

  public visitTuple<T extends IDL.Type[]>(
    _t: IDL.TupleClass<T>,
    components: IDL.Type[],
    __label: string
  ): FieldDetailsWithChild {
    const fields = components.reduce((acc, type, index) => {
      const details = type.accept(this, `_${index}_`) as FieldDetailsWithChild

      acc[`_${index}_`] = details

      return acc
    }, {} as Record<string, FieldDetailsWithChild | FieldDetails>)

    return {
      __label,
      __hidden: false,
      ...fields,
    }
  }

  private visitedRecursive: Record<string, true> = {}
  public visitRec<T>(
    _t: IDL.RecClass<T>,
    ty: IDL.ConstructType<T>,
    __label: string
  ): FieldDetailsWithChild {
    const recLabel = `${__label}_${this.counter}`
    if (!this.visitedRecursive[recLabel]) {
      this.visitedRecursive[recLabel] = true

      return ty.accept(this, __label) as FieldDetailsWithChild
    }

    return {
      __label,
      __hidden: false,
    }
  }

  public visitOpt<T>(
    _t: IDL.OptClass<T>,
    ty: IDL.Type<T>,
    __label: string
  ): FieldDetailsWithChild {
    const details = ty.accept(this, __label) as FieldDetailsWithChild
    return {
      __checked: false,
      __label,
      __hidden: false,
      optional: details,
    }
  }

  public visitVec<T>(
    _t: IDL.VecClass<T>,
    ty: IDL.Type<T>,
    __label: string
  ): FieldDetailsWithChild {
    const details = ty.accept(this, __label) as FieldDetailsWithChild
    return {
      __label,
      vector: details,
    }
  }

  private visiGenericType = (__label: string): InputDetails => {
    return {
      __label,
    }
  }

  public visitBool(_t: IDL.BoolClass, __label: string): InputDetails {
    return this.visiGenericType(__label)
  }

  public visitNull(_t: IDL.NullClass, __label: string): InputDetails {
    return this.visiGenericType(__label)
  }

  public visitType<T>(_t: IDL.Type<T>, __label: string): InputDetails {
    return this.visiGenericType(__label)
  }

  public visitPrincipal(_t: IDL.PrincipalClass, __label: string): InputDetails {
    return this.visiGenericType(__label)
  }

  public visitText(_t: IDL.TextClass, label: string): InputDetails {
    return this.visiGenericType(label)
  }

  public visitNumber<T>(_t: IDL.Type<T>, __label: string): InputDetails {
    return this.visiGenericType(__label)
  }

  public visitInt = this.visitNumber
  public visitNat = this.visitNumber
  public visitFloat = this.visitNumber
  public visitFixedInt = this.visitNumber
  public visitFixedNat = this.visitNumber

  public visitService(t: IDL.ServiceClass): ServiceDetails<A> {
    const methodDetails = t._fields.reduce((acc, services) => {
      const functionName = services[0] as FunctionName<A>
      const func = services[1]

      acc[functionName] = func.accept(this, functionName) as MethodDetails<A>

      return acc
    }, {} as ServiceDetails<A>)

    return methodDetails
  }
}
