import { createReActorStore } from "../src"
import { idlFactory } from "./candid/b3system"

describe("createReActorStore", () => {
  const { actorStore, initialize, getActor, service } = createReActorStore({
    canisterId: "2vxsx-fae",
    idlFactory,
    initializeOnCreate: false,
  })

  it("should return actor store", () => {
    expect(actorStore).toBeDefined()
    expect(service).toBeDefined()
    expect(getActor()).toBeNull()
  })

  test("Uninitialized", () => {
    const { methodState, initialized, initializing, error } =
      actorStore.getState()

    expect({ methodState, initialized, initializing, error }).toEqual({
      methodState: {},
      initialized: false,
      initializing: false,
      error: undefined,
    })
  })

  test("Initialized", async () => {
    await initialize()

    const { methodState, initialized, initializing, error } =
      actorStore.getState()

    expect({ methodState, initialized, initializing, error }).toEqual({
      methodState: {},
      initialized: true,
      initializing: false,
      error: undefined,
    })
  })
})
