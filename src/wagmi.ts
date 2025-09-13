import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, hardhat } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Number Gamble',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains: [sepolia, hardhat],
  ssr: false,
})