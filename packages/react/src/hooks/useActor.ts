import { createActorManager, createCandidAdapter } from "@ic-reactor/core"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAgentManager } from "./agent/useAgentManager"
import { actorHooks } from "../helpers"
import { useAuthState } from "./agent"
import { ActorManager, type BaseActor } from "../types"
import type { UseActorParameters, UseActorReturn } from "./types"

/**
 * A comprehensive hook that manages both the fetching of Candid interfaces
 * and the initialization of actor stores for Internet Computer (IC) canisters.
 * It simplifies the process of interacting with canisters by encapsulating
 * the logic for Candid retrieval and actor store management.
 *
 * You can use react context to share the actor hooks across your application.
 *
 * @example
 * ```tsx
 * import { AgentProvider, extractActorHooks, useActor } from "@ic-reactor/react"
 * import { createContext } from "react"
 * import type { ActorHooks } from "@ic-reactor/react/dist/types"
 * // With this import, you can have type safety for the actor's interface.
 * // You can get it from the `.did.d.ts` file generated by the DFX tool.
 * // or from dashboard https://dashboard.internetcomputer.org/canisters/<canister-id>
 * import type { Ledger } from "../declarations/ledger"
 *
 * const ActorContext = createContext<ActorHooks<Ledger> | null>(null)
 *
 * export const { useQueryCall, useUpdateCall } = extractActorHooks(ActorContext)
 *
 * const LedgerActor = ({ children }) => {
 *   const { hooks, fetching, fetchError } = useActor<Ledger>({
 *     canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai", // ICP Ledger canister
 *   })
 *
 *   return (
 *     <ActorContext.Provider value={hooks}>
 *       <h2>IC Canister Interaction</h2>
 *       {fetching && <p>Loading Candid interface...</p>}
 *       {fetchError && <p>Error: {fetchError}</p>}
 *       {hooks && children}
 *     </ActorContext.Provider>
 *   )
 * }
 * // later in the code
 * const CanisterName = () => {
 *   const { data } = useQueryCall({
 *     functionName: "name",
 *   })
 *
 *   return (
 *     <div>
 *       <h3>Query Call</h3>
 *       <p>Result: {JSON.stringify(data)}</p>
 *     </div>
 *   )
 * }
 *
 * const App = () => (
 *   <AgentProvider withDevtools>
 *     <LedgerActor>
 *       <CanisterName />
 *     </LedgerActor>
 *   </AgentProvider>
 * )
 *
 * export default App
 *
 * ```
 */
export const useActor = <A = BaseActor>(
  config: UseActorParameters
): UseActorReturn<A> => {
  const {
    canisterId,
    idlFactory: maybeIdlFactory,
    agentContext,
    didjsCanisterId,
    ...actorConfig
  } = config

  if (!canisterId) {
    throw new Error("canisterId is required")
  }

  const actorManager = useRef<ActorManager<A> | null>(null)

  const [{ fetching, fetchError }, setState] = useState({
    fetching: false,
    fetchError: null as string | null,
  })

  const agentManager = useAgentManager(agentContext)
  const authenticating = useAuthState().authenticating

  const fetchCandid = useCallback(async () => {
    if (fetching || authenticating) return

    setState({
      fetching: true,
      fetchError: null,
    })

    const agent = agentManager.getAgent()
    try {
      const candidManager = createCandidAdapter({
        agent,
        didjsCanisterId,
      })
      const { idlFactory } = await candidManager.getCandidDefinition(canisterId)

      setState({
        fetching: false,
        fetchError: null,
      })

      return idlFactory
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setState({
        fetchError: `Error fetching canister ${canisterId}`,
        fetching: false,
      })
    }
  }, [canisterId, authenticating, didjsCanisterId])

  useEffect(() => {
    if (maybeIdlFactory) {
      actorManager.current = createActorManager<A>({
        agentManager,
        idlFactory: maybeIdlFactory,
        canisterId,
        ...actorConfig,
      })
    } else {
      fetchCandid().then((idlFactory) => {
        if (!idlFactory) return
        actorManager.current = createActorManager<A>({
          agentManager,
          idlFactory,
          canisterId,
          ...actorConfig,
        })
      })
    }

    return actorManager.current?.cleanup()
  }, [fetchCandid, maybeIdlFactory, canisterId, agentManager])

  const hooks = useMemo(() => {
    if (fetching) return null
    if (actorManager.current === null) return null

    return actorHooks(actorManager.current)
  }, [canisterId, authenticating, actorManager.current, fetching])

  return { hooks, authenticating, fetching, fetchError }
}
