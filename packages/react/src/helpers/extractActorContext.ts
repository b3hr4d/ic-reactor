import { useContext } from "react"
import type {
  ActorHooksReturnType,
  BaseActor,
  CreateActorContextReturnType,
  FunctionName,
  UseQueryCall,
  UseUpdateCall,
} from "../types"

export function extractActorContext<A = BaseActor>(
  actorContext: React.Context<ActorHooksReturnType<A> | null>
): Omit<CreateActorContextReturnType<A>, "ActorProvider"> {
  /**
   * Hook for accessing the actor context, including the actor manager and state.
   * @returns The actor context, including the actor manager and state.
   * @example
   * ```tsx
   * function ActorComponent() {
   *  const { initialize, useActorState, useQueryCall, useUpdateCall, useMethodCall, useVisitMethod } = useActorContext();
   *  const { canisterId } = useActorState();
   *
   *  return (
   *   <div>
   *     <p>Canister ID: {canisterId}</p>
   *   </div>
   *  );
   * }
   *
   * function App() {
   *  return (
   *   <ActorProvider canisterId="rrkah-fqaaa-aaaaa-aaaaq-cai">
   *     <ActorComponent />
   *   </ActorProvider>
   *  );
   * }
   * ```
   */
  const useActorContext = () => {
    const context = useContext(actorContext)

    if (!context) {
      throw new Error("Actor hooks must be used within a ActorProvider")
    }

    return context
  }

  /**
   * Initializes the actor manager, setting up the actor's state.
   */
  const initialize = () => useActorContext().initialize()

  /**
   * Hook for accessing the current state of the actor, including the canister ID.
   *
   * @returns An object containing the current state of the actor from Zustand's store and the canister ID.
   * @example
   * ```tsx
   * function ActorStateComponent() {
   *   const { canisterId, initializing, error, initialized } = useActorState();
   *
   *   return (
   *    <div>
   *     <p>Canister ID: {canisterId}</p>
   *     <p>Initializing: {initializing.toString()}</p>
   *     <p>Initialized: {initialized.toString()}</p>
   *     <p>Error: {error?.message}</p>
   *   </div>
   *   );
   * }
   *```
   */
  const useActorState = () => useActorContext().useActorState()

  /**
   * Hook for making query calls to actors. It supports automatic refetching on component mount and at specified intervals.
   *
   * @param options Configuration object for the query call, including refetching options and other configurations passed to useReactorCall.
   * @returns An object containing the query call function and the current call state (data, error, loading, call, reset).
   * @example
   * ```tsx
   * function QueryCallComponent() {
   *    const { call, data, loading } = useQueryCall({
   *      functionName: 'getUserProfile',
   *      args: ['123'],
   *      refetchOnMount: true,
   *      refetchInterval: 5000, // refetch every 5 seconds
   *    });
   *
   *    if (loading) return <p>Loading profile...</p>;
   *
   *    return (
   *      <div>
   *        <p>User Profile: {JSON.stringify(data)}</p>
   *        <button onClick={call}>Refetch</button>
   *      </div>
   *    );
   * }
   * ```
   */
  const useQueryCall: UseQueryCall<A> = (args) =>
    useActorContext().useQueryCall(args)

  /**
   * Hook for making update calls to actors, handling loading states, and managing errors. It supports custom event handlers for loading, success, and error events.
   *
   * @param options Configuration object for the actor method call, including the method name, arguments, and event handlers.
   * @returns An object containing the method call function, a reset function to reset the call state to its default, and the current call state (data, error, loading, call, reset).
   * @example
   * ```tsx
   * function UpdateCallComponent() {
   *   const { call, data, loading } = useUpdateCall({
   *      functionName: 'updateUserProfile',
   *      args: ['123', { name: 'John Doe' }],
   *      onLoading: (loading) => console.log('Loading:', loading),
   *      onError: (error) => console.error('Error:', error),
   *      onSuccess: (data) => console.log('Success:', data),
   *   });
   *
   *  if (loading) return <p>Updating profile...</p>;
   *
   *  return (
   *    <div>
   *      <p>Updated Profile: {JSON.stringify(data)}</p>
   *      <button onClick={call}>Update</button>
   *    </div>
   *  );
   * }
   * ```
   */
  const useUpdateCall: UseUpdateCall<A> = (args) =>
    useActorContext().useUpdateCall(args)

  /**
   * Memoizes and returns a visit service function for a specific actor method.
   *
   * @param functionName The name of the actor method to visit.
   * @returns The visit service function for the specified method.
   */
  const useVisitMethod = (functionName: FunctionName<A>) =>
    useActorContext().useVisitMethod(functionName)

  return {
    useActorState,
    useQueryCall,
    useUpdateCall,
    useVisitMethod,
    initialize,
  }
}
