import { createReactorStore } from "@ic-reactor/core"
import { isInLocalOrDevelopment } from "@ic-reactor/core/dist/tools"
import { agentHooks, authHooks, actorHooks } from "./helpers"

import type { BaseActor, ReactorParameters, ReactorReturnType } from "./types"

/**
 * Initializes and configures the reactor environment for interacting with the Internet Computer (IC) blockchain within a React application.
 * It encapsulates the creation of actors, authentication, and agent management, offering a streamlined interface for blockchain interactions.
 *
 * @param options Configuration options for the reactor, including:
 *  - withProcessEnv (optional): Specifies whether to use process environment variables to determine if the environment is local or development. Defaults to false.
 *  - isLocalEnv (optional): Indicates if the current environment is local or development, influencing the agent and actor behavior. Useful for testing or development.
 *  - port (optional): Port number for the local or development environment.
 *  Extends `CreateReactorStoreParameters` which includes HTTP agent options, actor manager options (excluding `agentManager`), and an optional custom agent manager.
 *
 * @returns An object containing various hooks and utilities:
 *  - getAgent: Function to retrieve the configured IC agent.
 *  - getVisitFunction: Function to access the visit function from the actor manager, used for visitor pattern implementations.
 *  - Includes actor, auth, and agent hooks for state management, authentication, and agent operations.
 *
 * @example
 * ```typescript
 * import { createReactor } from "@ic-reactor/react";
 * import { ReactorCoreParameters } from "@ic-reactor/react/dist/types";
 * import { canisterId, idlFactory, actor } from "declaration/actor"
 *
 * const options: ReactorCoreParameters = {
 *   canisterId: "rrkah-fqaaa-aaaaa-aaaaq-cai",
 *   idlFactory: YOUR_IDL_FACTORY, // Your canister's IDL factory
 *   host: "https://localhost:8000", // IC network host         |
 *   isLocalEnv: true, // Set true for local network            | one of these
 *   withProcessEnv: true, // Use process.env to determine host |
 * };
 *
 * const { useActorStore, useAuthClient, useQueryCall } = createReactor(options);
 * // Now you can use the returned hooks in your React components
 * ```
 */
export const createReactor = <A = BaseActor>(
  options: ReactorParameters
): ReactorReturnType<A> => {
  const { isLocalEnv, withVisitor, withProcessEnv, ...args } = options

  const actorManager = createReactorStore<A>({
    isLocalEnv:
      isLocalEnv || (withProcessEnv ? isInLocalOrDevelopment() : false),
    withVisitor,
    ...args,
  })

  const getVisitFunction = () => {
    return actorManager.visitFunction
  }

  const getAgent = () => {
    return actorManager.agentManager.getAgent()
  }

  return {
    getAgent,
    getVisitFunction,
    ...actorHooks(actorManager),
    ...authHooks(actorManager.agentManager),
    ...agentHooks(actorManager.agentManager),
  }
}
