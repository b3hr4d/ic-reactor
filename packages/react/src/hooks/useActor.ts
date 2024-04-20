import { createActorManager } from "@ic-reactor/core"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAgentManager } from "./agent/useAgentManager"
import { actorHooks } from "../helpers"
import { useAuthState } from "./agent"
import type { ActorManager, IDL, BaseActor } from "../types"
import type { UseActorParameters, UseActorReturn } from "./types"
import { useCandidAdapter } from "./agent/useCandidAdapter"

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
    candidString,
    didjsCanisterId,
    ...actorConfig
  } = config

  if (!canisterId) {
    throw new Error("canisterId is required")
  }

  const [actorManager, setActorManager] = useState<ActorManager<A> | null>(null)

  useEffect(() => {
    if (actorManager?.canisterId !== canisterId.toString()) {
      setActorManager(null)
    }
    return actorManager?.cleanup()
  }, [canisterId, actorManager])

  const [{ fetching, fetchError }, setState] = useState({
    fetching: false,
    fetchError: null as string | null,
  })

  const candidAdapter = useCandidAdapter({
    didjsCanisterId,
  })

  const authenticating = useAuthState().authenticating

  const fetchCandid = useCallback(async () => {
    if (fetching || authenticating || !candidAdapter) return

    setState({
      fetching: true,
      fetchError: null,
    })

    try {
      const { idlFactory } = await candidAdapter.getCandidDefinition(canisterId)

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
  }, [canisterId, candidAdapter, authenticating, didjsCanisterId])

  const agentManager = useAgentManager()

  const initialActorManager = useCallback(
    (idlFactory?: IDL.InterfaceFactory) => {
      if (authenticating || !idlFactory) return
      console.log("initialActorManager")
      const actorManager = createActorManager<A>({
        agentManager,
        idlFactory,
        canisterId,
        ...actorConfig,
      })

      setActorManager(actorManager)
    },
    [canisterId, agentManager, authenticating]
  )

  const evaluateCandid = useCallback(
    async (candidString: string) => {
      if (!candidAdapter) {
        return
      }
      try {
        const definition = await candidAdapter.dynamicEvalJs(candidString)
        if (typeof definition?.idlFactory !== "function") {
          throw new Error("Error evaluating Candid definition")
        }
        return definition.idlFactory
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        setState({
          fetchError: `Error evaluating Candid definition, ${err}`,
          fetching: false,
        })
      }
    },
    [candidAdapter]
  )

  const handleActorInitialization = useCallback(async () => {
    if (maybeIdlFactory) {
      return initialActorManager(maybeIdlFactory)
    }
    try {
      if (candidString) {
        const idlFactory = await evaluateCandid(candidString)
        return initialActorManager(idlFactory)
      }
      const idlFactory = await fetchCandid()
      return initialActorManager(idlFactory)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      setState({
        fetchError: "Error occurred during actor initialization",
        fetching: false,
      })
    }
  }, [fetchCandid, evaluateCandid, maybeIdlFactory, initialActorManager])

  useEffect(() => {
    handleActorInitialization()
  }, [handleActorInitialization])

  const hooks = useMemo(() => {
    if (!actorManager) return null

    return actorHooks(actorManager)
  }, [actorManager])

  return { hooks, authenticating, fetching, fetchError }
}
