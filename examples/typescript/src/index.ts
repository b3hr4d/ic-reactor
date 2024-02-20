import { createReactorStore } from '@ic-reactor/core';
import { candid, canisterId, idlFactory } from './declarations/candid';

type Candid = typeof candid;

const store = createReactorStore<Candid>({
  canisterId,
  idlFactory,
});

// Usage example
await store.authenticate();
const { authClient } = store.getAuthState();

authClient?.login({
  onSuccess: () => {
    console.log('Logged in successfully');
  },
  onError: (error) => {
    console.error('Failed to login:', error);
  },
});
