import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './wagmi.ts'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <RainbowKitProvider>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
)