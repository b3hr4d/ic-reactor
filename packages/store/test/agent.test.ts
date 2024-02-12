import { AgentManager, IC_HOST_NETWORK_URI } from "../src"

describe("My IC Store and Actions", () => {
  const agentManager = new AgentManager({
    host: IC_HOST_NETWORK_URI,
    withDevtools: false,
  })

  it("should return agent store", async () => {
    const { getAgent } = agentManager

    expect(getAgent().isLocal()).toEqual(false)
    expect((await getAgent().getPrincipal()).toText()).toEqual("2vxsx-fae")
  })
})
