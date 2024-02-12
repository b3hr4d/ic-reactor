import { Cbor } from "@dfinity/agent"
import { IDL } from "@dfinity/candid"
import fetchMock from "jest-fetch-mock"
import { ActorManager, AgentManager } from "../src"
import { idlFactory } from "./candid/hello"
import { _SERVICE } from "./candid/hello/hello.did"

fetchMock.enableMocks()

const canisterDecodedReturnValue = "Hello, World!"
const expectedReplyArg = IDL.encode([IDL.Text], [canisterDecodedReturnValue])

fetchMock.mockResponse(async (req) => {
  if (req.url.endsWith("/call")) {
    return Promise.resolve({
      status: 200,
    })
  }

  const responseObj = {
    status: "replied",
    reply: {
      arg: expectedReplyArg,
    },
  }

  return Promise.resolve({
    status: 200,
    body: Cbor.encode(responseObj),
  })
})

describe("CreateActor", () => {
  const callback = jest.fn()

  const agentManager = new AgentManager({
    host: "https://local-mock",
    verifyQuerySignatures: false,
    withDevtools: false,
  })

  const { subscribeAgent } = agentManager

  subscribeAgent(callback)

  const { callMethod, initialize, actorStore } = new ActorManager<_SERVICE>({
    agentManager,
    canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
    idlFactory,
    initializeOnCreate: false,
  })

  it("should initialized the actor", () => {
    expect(callback).toHaveBeenCalledTimes(0)

    expect(actorStore.getState().initialized).toEqual(false)

    initialize()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("should queryCall the query method", async () => {
    const data = await callMethod("greet", "World")

    expect(data).toEqual(canisterDecodedReturnValue)
  })

  it("should authenticate the actor", async () => {
    await agentManager.authenticate()

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
