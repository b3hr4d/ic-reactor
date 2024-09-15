import {
  useUserPrincipal,
  CandidAdapterProvider,
  useAuth,
} from "@ic-reactor/react"
import Login from "./Login"
import { CKBTCLedgerProvider } from "./CKBTC"
import { CKBTCMinterProvider } from "./Minter"
import GetBTCAddress from "./GetBTCAddress"
import CkbtcUpdateBalance from "./MinterUpdateBalance"
import MinterRetrieveBTC from "./MinterRetrieveBtc"
import CKBTCTransfer from "./CKBTCTransfer"

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const { authenticated } = useAuth()
  const userPrincipal = useUserPrincipal()

  return (
    <div>
      <h1>ckBTC(TestNet) Wallet</h1>
      <Login />
      <CandidAdapterProvider>
        {authenticated && userPrincipal ? (
          <CKBTCLedgerProvider>
            <CKBTCMinterProvider>
              <GetBTCAddress userPrincipal={userPrincipal}>
                <CkbtcUpdateBalance userPrincipal={userPrincipal}>
                  <MinterRetrieveBTC userPrincipal={userPrincipal} />
                  <CKBTCTransfer />
                </CkbtcUpdateBalance>
              </GetBTCAddress>
            </CKBTCMinterProvider>
          </CKBTCLedgerProvider>
        ) : (
          <p>Login to see your BTC address and balance</p>
        )}
      </CandidAdapterProvider>
    </div>
  )
}

export default App
