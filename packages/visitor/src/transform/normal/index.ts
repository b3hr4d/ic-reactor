import { IDL } from "@dfinity/candid"
import type { ActorSubclass } from "@dfinity/agent"
import type { MethodResult, DynamicDataArgs } from "./types"
import { isImage, isUrl } from "../../helper"
import type {
  DefaultActorType,
  FunctionName,
  Principal,
} from "@ic-reactor/store"

export * from "./types"

export class VisitTransform<
  A extends ActorSubclass<any> = DefaultActorType,
  M extends FunctionName<A> = FunctionName<A>
> extends IDL.Visitor<DynamicDataArgs, MethodResult<A, M>> {
  public visitFunc(
    t: IDL.FuncClass,
    { value, label }: DynamicDataArgs<any>
  ): MethodResult<A, M> {
    const values = t.argTypes.map((type, index, types) => {
      return type.accept(this, {
        label: `ret${index}`,
        value: types.length > 1 ? (value as any[])[index] : value,
      }) as MethodResult<A, M>
    })

    return {
      type: "normal",
      label,
      description: t.name,
      values,
    }
  }

  public visitRec<T>(
    _t: IDL.RecClass<T>,
    ty: IDL.ConstructType<T>,
    data: DynamicDataArgs
  ): MethodResult<A, M> {
    return ty.accept(this, data) as MethodResult<A, M>
  }

  public visitOpt<T>(
    t: IDL.OptClass<T>,
    ty: IDL.Type<T>,
    { value, label }: DynamicDataArgs<T[]>
  ): MethodResult<A, M> {
    if (value?.length === 0) {
      return {
        type: "optional",
        label,
        description: t.name,
        value: null,
      }
    }

    return {
      type: "optional",
      label,
      description: t.name,
      value: ty.accept(this, { value: value[0], label }),
    }
  }

  public visitRecord(
    t: IDL.RecordClass,
    fields: Array<[string, IDL.Type]>,
    { value, label }: DynamicDataArgs<Record<string, unknown>>
  ): MethodResult<A, M> {
    const values = fields.reduce((acc, [key, type]) => {
      if (value[key] === undefined) {
        return acc
      }

      const field = type.accept(this, {
        label: key,
        value: value[key],
      }) as MethodResult<A, M>

      acc.push(field)

      return acc
    }, [] as Array<MethodResult<A, M>>)

    return {
      type: "record",
      label,
      description: t.name,
      values,
    }
  }

  public visitTuple<T extends any[]>(
    t: IDL.TupleClass<T>,
    components: IDL.Type[],
    { value, label }: DynamicDataArgs<T>
  ): MethodResult<A, M> {
    const values = components.reduce(
      (acc, type, index) => {
        const field = type.accept(this, {
          label: `_${index}_`,
          value: value[index],
        }) as MethodResult<A, M>
        acc.push(field)

        return acc
      },

      [] as MethodResult<A, M>[]
    )

    return {
      type: "tuple",
      label,
      description: t.name,
      values,
    }
  }
  public visitVariant(
    t: IDL.VariantClass,
    fields: Array<[string, IDL.Type]>,
    { value, label }: DynamicDataArgs<Record<string, unknown>>
  ): MethodResult<A, M> {
    // Find the first field that matches and has a value
    for (const [key, type] of fields) {
      if (value[key] !== undefined) {
        return type.accept(this, {
          label: key,
          value: value[key],
        }) as MethodResult<A, M>
      }
    }

    return {
      type: "variant",
      label,
      description: t.name,
    }
  }
  public visitVec<T>(
    t: IDL.VecClass<T>,
    ty: IDL.Type<T>,
    { value, label }: DynamicDataArgs<T[]>
  ): MethodResult<A, M> {
    if (ty instanceof IDL.FixedNatClass && ty._bits === 8) {
      return {
        type: "blob",
        label,
        description: t.name,
        value: value as unknown as Uint8Array,
      }
    }

    const values = value.map(
      (val, index) =>
        ty.accept(this, {
          label: `${label}-${index}`,
          value: val,
        }) as MethodResult<A, M>
    )

    return {
      type: "vector",
      label,
      description: t.name,
      values,
    }
  }

  public visitNumber<T>(
    t: IDL.Type<T>,
    { value, label }: DynamicDataArgs<number>
  ): MethodResult<A, M> {
    return {
      type: "number",
      label,
      description: t.name,
      value,
    }
  }

  public visitText(
    t: IDL.TextClass,
    { value, label }: DynamicDataArgs<string>
  ): MethodResult<A, M> {
    const isurl = isUrl(value)
    const isImg = isImage(value)

    return {
      type: isImg ? "image" : isurl ? "url" : "text",
      label,
      description: t.name,
      value,
    }
  }

  public visitInt(
    t: IDL.IntClass,
    data: DynamicDataArgs<number>
  ): MethodResult<A, M> {
    return this.visitNumber(t, data)
  }

  public visitNat(
    t: IDL.NatClass,
    data: DynamicDataArgs<number>
  ): MethodResult<A, M> {
    return this.visitNumber(t, data)
  }

  public visitFloat(
    t: IDL.FloatClass,
    data: DynamicDataArgs<number>
  ): MethodResult<A, M> {
    return this.visitNumber(t, data)
  }

  public visitFixedInt(
    t: IDL.FixedIntClass,
    data: DynamicDataArgs<number>
  ): MethodResult<A, M> {
    return this.visitNumber(t, data)
  }

  public visitFixedNat(
    t: IDL.FixedNatClass,
    data: DynamicDataArgs<number>
  ): MethodResult<A, M> {
    return this.visitNumber(t, data)
  }

  public visitBool(
    t: IDL.BoolClass,
    { value, label }: DynamicDataArgs<boolean>
  ): MethodResult<A, M> {
    return {
      type: "boolean",
      label,
      description: t.name,
      value,
    }
  }

  public visitType<T>(
    t: IDL.Type<T>,
    { value, label }: DynamicDataArgs
  ): MethodResult<A, M> {
    return {
      type: "unknown",
      label,
      description: t.name,
      value: t.valueToString(value),
    }
  }

  public visitPrincipal(
    t: IDL.PrincipalClass,
    { value, label }: DynamicDataArgs<Principal>
  ): MethodResult<A, M> {
    return {
      type: "principal",
      label,
      description: t.name,
      value,
    }
  }
}
