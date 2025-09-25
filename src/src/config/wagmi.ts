import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'NumberGamble',
  projectId: 'YOUR_PROJECT_ID', // Replace with WalletConnect Cloud project id
  chains: [sepolia],
  ssr: false,
});
