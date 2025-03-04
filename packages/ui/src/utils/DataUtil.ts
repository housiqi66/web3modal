import { ClientCtrl, ConfigCtrl, CoreUtil, ExplorerCtrl, OptionsCtrl } from '@web3modal/core'
import { UiUtil } from './UiUtil'

export const DataUtil = {
  externalWallets() {
    const { isStandalone } = OptionsCtrl.state
    if (isStandalone) {
      return []
    }
    let connectors = ClientCtrl.client().getConnectors()
    connectors = connectors.filter(connector => connector.id !== 'injected')

    return connectors
  },

  manualMobileWallets() {
    return ConfigCtrl.state.mobileWallets ?? []
  },

  manualDesktopWallets() {
    return ConfigCtrl.state.desktopWallets ?? []
  },

  manualWallets() {
    const { mobileWallets, desktopWallets } = ConfigCtrl.state

    return (CoreUtil.isMobile() ? mobileWallets : desktopWallets) ?? []
  },

  installedInjectedWallets() {
    const { isStandalone } = OptionsCtrl.state
    if (isStandalone) {
      return []
    }
    const isInstalled = ClientCtrl.client().isInjectedProviderInstalled()
    if (!isInstalled) {
      return []
    }

    const { namespace } = ClientCtrl.client()
    const { injectedWallets } = ExplorerCtrl.state
    let wallets = injectedWallets.filter(({ injected }) => {
      return Boolean(
        injected.some(
          i =>
            ClientCtrl.client().safeCheckInjectedProvider(i.injected_id) &&
            i.namespace === namespace
        )
      )
    })

    // Extension was loaded that masks as metamask, we need to filter mm out
    if (wallets.length > 1) {
      wallets = wallets.filter(({ injected }) => {
        const injectedIds = injected.map(({ injected_id }) => injected_id)

        return Boolean(injectedIds.every(id => id !== 'isMetaMask'))
      })
    }

    return wallets.length ? wallets : [{ name: 'Browser', id: 'browser', image_id: undefined }]
  },

  injectedWallets() {
    const { isStandalone } = OptionsCtrl.state
    const { explorerExcludedWalletIds, explorerRecommendedWalletIds } = ConfigCtrl.state
    const isMobile = CoreUtil.isMobile()
    if (isStandalone || explorerExcludedWalletIds === 'ALL' || isMobile) {
      return []
    }
    const { namespace } = ClientCtrl.client()
    const { injectedWallets } = ExplorerCtrl.state

    const wallets = injectedWallets.filter(({ id, injected }) => {
      const excludedIds = CoreUtil.isArray(explorerExcludedWalletIds)
        ? explorerExcludedWalletIds
        : []
      const recommendedIds = CoreUtil.isArray(explorerRecommendedWalletIds)
        ? explorerRecommendedWalletIds
        : []

      return Boolean(
        injected.some(
          i =>
            i.namespace === namespace && !excludedIds.includes(id) && !recommendedIds.includes(id)
        )
      )
    })

    return wallets
  },

  recentWallet() {
    return UiUtil.getRecentWallet()
  },

  recomendedWallets(skipRecent = false) {
    const injectedWallets = DataUtil.installedInjectedWallets()
    const injectedIds = injectedWallets.map(({ id }) => id)
    const recentWalletId = skipRecent ? undefined : DataUtil.recentWallet()?.id
    const existingIds = [...injectedIds, recentWalletId]
    const { recomendedWallets } = ExplorerCtrl.state
    const wallets = recomendedWallets.filter(wallet => !existingIds.includes(wallet.id))

    return wallets
  }
}
