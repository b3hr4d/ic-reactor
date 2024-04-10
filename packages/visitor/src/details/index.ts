import { IDL } from "@dfinity/candid"
import { BaseActor, FunctionName } from "@ic-reactor/core/dist/types"
import { MethodDetails, ServiceDetails, Status } from "./types"
import { VisitReturnDetails } from "./returns"
import { VisitArgDetails } from "./args"

export * from "./returns"
export * from "./args"

export class VisitDetails<A = BaseActor> extends IDL.Visitor<
  string,
  ServiceDetails<A> | MethodDetails<A>
> {
  private argsVisitor = new VisitArgDetails<A>()
  private returnsVisitor = new VisitReturnDetails<A>()

  public visitFunc(
    t: IDL.FuncClass,
    functionName: FunctionName<A>
  ): MethodDetails<A> {
    const { details: argDetails, ...restArgs } = this.argsVisitor.visitFunc(
      t,
      functionName
    )
    const { details: retDetails, ...restRets } = this.returnsVisitor.visitFunc(
      t,
      { __label: functionName, __status: Status.Hidden }
    )

    return {
      argDetails,
      retDetails,
      ...restRets,
      ...restArgs,
    }
  }

  public visitService(t: IDL.ServiceClass): ServiceDetails<A> {
    const methodFields = t._fields.reduce((acc, services) => {
      const functionName = services[0] as FunctionName<A>
      const func = services[1]

      acc[functionName] = func.accept(this, functionName) as MethodDetails<A>

      return acc
    }, {} as ServiceDetails<A>)

    return methodFields
  }
}
