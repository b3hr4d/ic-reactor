import { useStore } from "zustand"
import { useCallback, useEffect, useState } from "react"
import type {
  AgentManager,
  UseAuthClientParameters,
  LogoutParameters,
  UseAuthClientReturnType,
  LoginParameters,
  LoginState,
  AuthHooksReturnType,
} from "../types"
import {
  IC_INTERNET_IDENTITY_PROVIDER,
  LOCAL_INTERNET_IDENTITY_PROVIDER,
} from "@ic-reactor/core/dist/tools"

export const authHooks = (agentManager: AgentManager): AuthHooksReturnType => {
  const { authenticate: authenticator, authStore, isLocalEnv } = agentManager

  const useAuthState = () => useStore(authStore)

  const useUserPrincipal = () => useAuthState()?.identity?.getPrincipal()

  const useAuthClient = (
    events?: UseAuthClientParameters
  ): UseAuthClientReturnType => {
    const [loginState, setLoginState] = useState<LoginState>({
      loading: false,
      error: null,
    })
    const { authClient, authenticated, authenticating, identity, error } =
      useAuthState()

    const authenticate = useCallback(async () => {
      try {
        const identity = await authenticator()
        events?.onAuthenticationSuccess?.(identity)
        return identity
      } catch (e) {
        events?.onAuthenticationFailure?.(e as Error)
        throw e
      }
    }, [authenticator, events])

    const login = useCallback(
      async (options?: LoginParameters) => {
        if (!authClient) {
          throw new Error("Auth client not initialized")
        }

        try {
          setLoginState({ loading: true, error: null })
          await authClient.login({
            identityProvider: isLocalEnv
              ? LOCAL_INTERNET_IDENTITY_PROVIDER
              : IC_INTERNET_IDENTITY_PROVIDER,
            ...options,
            onSuccess: async () => {
              try {
                const identity = await authenticate()
                const principal = identity.getPrincipal()
                options?.onSuccess?.()
                events?.onLoginSuccess?.(principal)
                setLoginState({ loading: false, error: null })
              } catch (e) {
                const error = e as Error
                setLoginState({ loading: false, error })
                events?.onLoginError?.(error)
              }
            },
            onError: (e) => {
              const error = new Error(`Login failed: ${e}`)
              setLoginState({ loading: false, error })
              events?.onLoginError?.(error)
            },
          })
        } catch (e) {
          const error = e as Error
          setLoginState({ loading: false, error })
          events?.onLoginError?.(error)
        }
      },
      [authClient, authenticate, isLocalEnv, events]
    )

    const logout = useCallback(
      async (options?: LogoutParameters) => {
        if (!authClient) {
          throw new Error("Auth client not initialized")
        }
        await authClient.logout(options)
        await authenticate()
        events?.onLoggedOut?.()
      },
      [authClient, authenticate, events]
    )

    useEffect(() => {
      if (!authClient) {
        // eslint-disable-next-line no-console
        authenticate().catch(console.error)
      }
    }, [authClient, authenticate])

    return {
      error,
      authClient,
      authenticated,
      authenticating,
      identity,
      login,
      logout,
      authenticate,
      loginLoading: loginState.loading,
      loginError: loginState.error,
    }
  }

  return {
    useUserPrincipal,
    useAuthState,
    useAuthClient,
  }
}
