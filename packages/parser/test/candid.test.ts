import { CandidAdapter } from "../src"
import { createAgentManager } from "@ic-reactor/core"

describe("createReactorStore", () => {
  const agentManager = createAgentManager()

  const candidAdapter = new CandidAdapter({ agentManager })

  it("compile the candid string", async () => {
    const candid = await candidAdapter.didTojs(
      `service:{icrc1_name:()->(text) query;}`
    )
    console.log("🚀 ~ it ~ candid:", candid)
  })

  // it("should return candid idlFactory", async () => {
  //   const candid = await candidAdapter.getCandidDefinition(
  //     "a4gq6-oaaaa-aaaab-qaa4q-cai"
  //   )

  //   expect(candid.idlFactory).toBeDefined()
  // })

  // const canisterId = "ryjl3-tyaaa-aaaaa-aaaba-cai"

  // it("should return fetch candid definition and callMethod", async () => {
  //   const { idlFactory } = await candidAdapter.getCandidDefinition(canisterId)

  //   const { callMethod } = createReactorStore({
  //     canisterId,
  //     idlFactory,
  //     agentManager,
  //   })

  //   const name = await callMethod("name")

  //   expect(name).toEqual({ name: "Internet Computer" })
  // })
})
