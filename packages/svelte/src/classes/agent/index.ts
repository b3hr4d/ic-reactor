/* eslint-disable no-console */
import { HttpAgent } from "@dfinity/agent"
import { AuthClient } from "@dfinity/auth-client"
import type { AuthClientLoginOptions } from "../../types"
import type {
  AgentState,
  AgentManagerParameters,
  UpdateAgentParameters,
  AuthState,
} from "./types"
import {
  IC_HOST_NETWORK_URI,
  IC_INTERNET_IDENTITY_PROVIDER,
  LOCAL_INTERNET_IDENTITY_PROVIDER,
} from "../../utils/constants"
import { derived, writable } from "svelte/store"

export class AgentManager {
  private _agent: HttpAgent
  private _auth: AuthClient | null = null
  private _subscribers: Array<(agent: HttpAgent) => void> = []

  public agentStore = writable<AgentState>({
    initialized: false,
    initializing: false,
    error: undefined,
    network: "ic",
  })

  public authStore = writable<AuthState>({
    identity: null,
    authenticating: false,
    authenticated: false,
    error: undefined,
  })

  private updateAgentState = (newState: Partial<AgentState>) => {
    this.agentStore.update((state) => ({ ...state, ...newState }))
  }

  private updateAuthState = (newState: Partial<AuthState>) => {
    this.authStore.update((state) => ({ ...state, ...newState }))
  }

  constructor(options?: AgentManagerParameters) {
    const {
      port = 4943,
      withLocalEnv,
      host: optionHost,
      ...agentOptions
    } = options || {}
    const host = withLocalEnv
      ? `http://127.0.0.1:${port}`
      : optionHost
      ? optionHost.includes("localhost")
        ? optionHost.replace("localhost", "127.0.0.1")
        : optionHost
      : IC_HOST_NETWORK_URI

    this._agent = new HttpAgent({ ...agentOptions, host })
    this.initializeAgent()
  }

  private initializeAgent = async () => {
    const isLocalEnv = this.getIsLocal()
    this.updateAgentState({
      initializing: true,
      error: undefined,
      network: isLocalEnv ? "local" : "ic",
    })
    if (isLocalEnv) {
      try {
        await this._agent.fetchRootKey()
      } catch (error) {
        this.updateAgentState({ error: error as Error, initializing: false })
      }
    }
    this.updateAgentState({ initialized: true, initializing: false })
  }

  public subscribeAgent = (
    callback: (agent: HttpAgent) => void,
    initialize = true
  ) => {
    if (initialize) {
      callback(this._agent)
    }
    this._subscribers.push(callback)
    return () => this.unsubscribeAgent(callback)
  }

  public unsubscribeAgent = (callback: (agent: HttpAgent) => void) => {
    this._subscribers = this._subscribers.filter((sub) => sub !== callback)
  }

  private notifySubscribers = async () => {
    await Promise.all(
      this._subscribers.map(async (callback) => callback(this._agent))
    )
  }

  public updateAgent = async (options?: UpdateAgentParameters) => {
    const { agent } = options || {}

    if (agent) {
      this._agent = agent
    } else if (options) {
      this._agent = new HttpAgent(options)
      await this.initializeAgent()
    }

    await this.notifySubscribers()
  }

  public authenticate = async () => {
    console.log(
      `Authenticating on ${this.getIsLocal() ? "local" : "ic"} network`
    )
    this.updateAuthState({ authenticating: true })

    try {
      this._auth = await AuthClient.create()
      const authenticated = await this._auth.isAuthenticated()
      const identity = this._auth.getIdentity()

      this._agent.replaceIdentity(identity)
      this.notifySubscribers()

      this.updateAuthState({
        authenticated,
        identity,
        authenticating: false,
      })

      return identity
    } catch (error) {
      this.updateAuthState({ error: error as Error, authenticating: false })
      throw error
    }
  }

  public login = async (options?: AuthClientLoginOptions) => {
    this.updateAuthState({ authenticating: true })
    if (!this._auth) {
      await this.authenticate()
    }

    if (!this._auth) {
      throw new Error("Auth client not initialized")
    }

    await this._auth.login({
      identityProvider: this.getIsLocal()
        ? LOCAL_INTERNET_IDENTITY_PROVIDER
        : IC_INTERNET_IDENTITY_PROVIDER,
      ...options,
      onSuccess: async (msg) => {
        await this.authenticate()
        options?.onSuccess?.(msg)
      },
    })
  }

  public logout = async (options?: { returnTo?: string }) => {
    if (!this._auth) {
      throw new Error("Auth client not initialized")
    }
    await this._auth.logout(options)
    await this.authenticate()
  }

  // agent store
  public getAgent = () => {
    return this._agent
  }

  public getIsLocal = () => {
    return this._agent.isLocal?.() === true
  }

  public agentState$ = derived(this.agentStore, ($agentState) => $agentState)
  public authState$ = derived(this.authStore, ($authState) => $authState)
}
