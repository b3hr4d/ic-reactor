import type {
  ArgTypeFromIDLType,
  DefaultArg,
  MethodArgs,
  InputArg,
  NumberArg,
  PrincipalArg,
  OptionalArgs,
  RecordArgs,
  RecursiveArgs,
  TupleArgs,
  VariantArgs,
  VectorArgs,
  MethodArgsDefaultValues,
  DynamicArgTypeByClass,
  AllArgTypes,
  ServiceArgs,
  ArgsDefaultValues,
  BlobArgs,
} from "./types"
import {
  extractAndSortArgs,
  isQuery,
  validateError,
  validateNumberError,
} from "../../helper"
import { IDL } from "@dfinity/candid"
import type { BaseActor, FunctionName } from "@ic-reactor/core/dist/types"

/**
 * Visit the candid file and extract the fields.
 * It returns the extracted service fields.
 *
 */
export class VisitArgs<A = BaseActor> extends IDL.Visitor<
  string,
  MethodArgs<A> | DefaultArg | ServiceArgs<A>
> {
  public visitFunc(
    t: IDL.FuncClass,
    functionName: FunctionName<A>
  ): MethodArgs<A> {
    const functionType = isQuery(t) ? "query" : "update"

    const { fields, defaultValue } = t.argTypes.reduce(
      (acc, arg, index) => {
        const field = arg.accept(this, `arg${index}`) as ArgTypeFromIDLType<
          typeof arg
        >

        acc.fields.push(field)

        acc.defaultValue[`arg${index}`] =
          field.defaultValue ?? field.defaultValues ?? {}

        return acc
      },
      {
        fields: [] as DynamicArgTypeByClass<IDL.Type>[],
        defaultValue: {} as MethodArgsDefaultValues<FunctionName<A>>,
      }
    )

    const defaultValues = {
      [functionName]: defaultValue,
    } as ArgsDefaultValues<A>

    const validateAndReturnArgs = (data: ArgsDefaultValues<A>) => {
      const argsObject = data[functionName]
      const args = extractAndSortArgs(argsObject)

      let errorMessages = ""

      const isValid = args.some((arg, i) => {
        const validateArg = fields[i]?.validate(arg)
        if (typeof validateArg === "string") {
          errorMessages = validateArg
          return false
        }
        return true
      })

      if (isValid === true) {
        return args
      } else {
        throw new Error(errorMessages)
      }
    }

    return {
      functionType,
      functionName,
      validateAndReturnArgs,
      defaultValues,
      fields,
    }
  }

  public visitRecord(
    t: IDL.RecordClass,
    _fields: Array<[string, IDL.Type]>,
    label: string
  ): RecordArgs<IDL.Type> {
    const { fields, defaultValues } = _fields.reduce(
      (acc, [key, type]) => {
        const field = type.accept(this, key) as AllArgTypes<typeof type>

        acc.fields.push(field)
        acc.defaultValues[key] = field.defaultValue || field.defaultValues

        return acc
      },
      {
        fields: [] as AllArgTypes<IDL.Type>[],
        defaultValues: {} as Record<string, ArgTypeFromIDLType<IDL.Type>>,
      }
    )

    return {
      type: "record",
      label,
      validate: validateError(t),
      fields,
      defaultValues,
    }
  }

  public visitVariant(
    t: IDL.VariantClass,
    fields_: Array<[string, IDL.Type]>,
    label: string
  ): VariantArgs<IDL.Type> {
    const { fields, options } = fields_.reduce(
      (acc, [key, type]) => {
        const field = type.accept(this, key) as AllArgTypes<typeof type>

        acc.fields.push(field)
        acc.options.push(key)

        return acc
      },
      {
        fields: [] as AllArgTypes<IDL.Type>[],
        options: [] as string[],
      }
    )

    const defaultValue = options[0]

    const defaultValues = {
      [defaultValue]: fields[0].defaultValue || fields[0].defaultValues || {},
    }

    return {
      type: "variant",
      fields,
      options,
      label,
      defaultValue,
      defaultValues,
      validate: validateError(t),
    }
  }

  public visitTuple<T extends IDL.Type[]>(
    t: IDL.TupleClass<T>,
    components: IDL.Type[],
    label: string
  ): TupleArgs<IDL.Type> {
    const { fields, defaultValues } = components.reduce(
      (acc, type, index) => {
        const field = type.accept(this, `_${index}_`) as AllArgTypes<
          typeof type
        >
        acc.fields.push(field)
        acc.defaultValues.push(field.defaultValue || field.defaultValues)

        return acc
      },
      {
        fields: [] as AllArgTypes<IDL.Type>[],
        defaultValues: [] as ArgTypeFromIDLType<IDL.Type>[],
      }
    )

    return {
      type: "tuple",
      validate: validateError(t),
      fields,
      label,
      defaultValues,
    }
  }

  public visitRec<T>(
    t: IDL.RecClass<T>,
    ty: IDL.ConstructType<T>,
    label: string
  ): RecursiveArgs {
    return {
      type: "recursive",
      label,
      validate: validateError(t),
      name: ty.name,
      extract: () => ty.accept(this, label) as VariantArgs<IDL.Type>,
    }
  }

  public visitOpt<T>(
    t: IDL.OptClass<T>,
    ty: IDL.Type<T>,
    label: string
  ): OptionalArgs {
    const field = ty.accept(this, label) as DynamicArgTypeByClass<typeof ty>

    return {
      type: "optional",
      field,
      defaultValue: [],
      validate: validateError(t),
      label,
    }
  }

  public visitVec<T>(
    t: IDL.VecClass<T>,
    ty: IDL.Type<T>,
    label: string
  ): VectorArgs | BlobArgs {
    const field = ty.accept(this, label) as DynamicArgTypeByClass<typeof ty>

    if ("_bits" in ty && ty._bits === 8) {
      return {
        type: "blob",
        field,
        defaultValue: [],
        validate: validateError(t),
        label,
      }
    }

    return {
      type: "vector",
      field,
      validate: validateError(t),
      defaultValue: [],
      label,
    }
  }

  public visitType<T>(t: IDL.Type<T>, label: string): InputArg<IDL.Type<T>> {
    return {
      type: "unknown",
      validate: validateError(t),
      label,
      required: true,
      defaultValue: undefined as InputArg<IDL.Type<T>>["defaultValue"],
    }
  }

  public visitPrincipal(t: IDL.PrincipalClass, label: string): PrincipalArg {
    return {
      type: "principal",
      validate: validateError(t),
      maxLength: 64,
      minLength: 7,
      label,
      required: true,
      defaultValue: "",
    }
  }

  public visitBool(t: IDL.BoolClass, label: string): InputArg<typeof t> {
    return {
      type: "boolean",
      validate: validateError(t),
      label,
      required: true,
      defaultValue: false,
    }
  }

  public visitNull(t: IDL.NullClass, label: string): InputArg<typeof t> {
    return {
      type: "null",
      required: true,
      label,
      validate: validateError(t),
      defaultValue: null,
    }
  }

  public visitText(t: IDL.TextClass, label: string): InputArg<typeof t> {
    return {
      type: "text",
      validate: validateError(t),
      required: true,
      label,
      defaultValue: "",
    }
  }

  public visitNumber<T>(t: IDL.Type<T>, label: string): NumberArg {
    return {
      type: "number",
      required: true,
      validate: validateNumberError(t),
      label,
      defaultValue: "",
    }
  }

  public visitInt(t: IDL.IntClass, label: string): NumberArg {
    return this.visitNumber(t, label)
  }

  public visitNat(t: IDL.NatClass, label: string): NumberArg {
    return this.visitNumber(t, label)
  }

  public visitFloat(t: IDL.FloatClass, label: string): NumberArg {
    return this.visitNumber(t, label)
  }

  public visitFixedInt(t: IDL.FixedIntClass, label: string): NumberArg {
    return this.visitNumber(t, label)
  }

  public visitFixedNat(t: IDL.FixedNatClass, label: string): NumberArg {
    return this.visitNumber(t, label)
  }

  public visitService(t: IDL.ServiceClass): ServiceArgs<A> {
    const methodFields = t._fields.reduce((acc, services) => {
      const functionName = services[0] as FunctionName<A>
      const func = services[1]

      acc[functionName] = func.accept(this, functionName) as MethodArgs<A>

      return acc
    }, {} as ServiceArgs<A>)

    return methodFields
  }
}
