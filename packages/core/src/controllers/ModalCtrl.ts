import { proxy, subscribe as valtioSub } from 'valtio/vanilla'
import type { ModalCtrlState } from '../types/controllerTypes'
import { AccountCtrl } from './AccountCtrl'
import { ConfigCtrl } from './ConfigCtrl'
import { OptionsCtrl } from './OptionsCtrl'
import { RouterCtrl } from './RouterCtrl'
import { WcConnectionCtrl } from './WcConnectionCtrl'

// -- types -------------------------------------------------------- //
export interface OpenOptions {
  uri?: string
  standaloneChains?: string[]
  route?: 'Account' | 'ConnectWallet' | 'Help' | 'SelectNetwork'
}

// -- initial state ------------------------------------------------ //
const state = proxy<ModalCtrlState>({
  open: false
})

// -- controller --------------------------------------------------- //
export const ModalCtrl = {
  state,

  subscribe(callback: (newState: ModalCtrlState) => void) {
    return valtioSub(state, () => callback(state))
  },

  async open(options?: OpenOptions) {
    return new Promise<void>(resolve => {
      const { isStandalone, isUiLoaded, isDataLoaded } = OptionsCtrl.state
      const { pairingUri } = WcConnectionCtrl.state
      const { isConnected } = AccountCtrl.state
      const { enableNetworkView } = ConfigCtrl.state

      if (isStandalone) {
        OptionsCtrl.setStandaloneUri(options?.uri)
        OptionsCtrl.setStandaloneChains(options?.standaloneChains)
        RouterCtrl.reset('ConnectWallet')
      } else if (options?.route) {
        RouterCtrl.reset(options.route)
      } else if (isConnected) {
        RouterCtrl.reset('Account')
      } else if (enableNetworkView) {
        RouterCtrl.reset('SelectNetwork')
      } else {
        RouterCtrl.reset('ConnectWallet')
      }

      // Open modal if essential async data is ready
      if (isUiLoaded && isDataLoaded && (isStandalone || pairingUri || isConnected)) {
        state.open = true
        resolve()
      }
      // Otherwise (slow network) re-attempt open checks
      else {
        const interval = setInterval(() => {
          const opts = OptionsCtrl.state
          const connection = WcConnectionCtrl.state
          if (
            opts.isUiLoaded &&
            opts.isDataLoaded &&
            (opts.isStandalone || connection.pairingUri || isConnected)
          ) {
            clearInterval(interval)
            state.open = true
            resolve()
          }
        }, 200)
      }
    })
  },

  close() {
    state.open = false
  }
}
