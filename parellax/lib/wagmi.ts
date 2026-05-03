import { createConfig, http } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

export const galileo = {
  id: 16602,
  name: '0G Galileo',
  nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
} as const

export const wagmiConfig = createConfig({
  chains: [galileo],
  connectors: [
    metaMask({
      dapp: {
        name: 'Parellax',
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      },
    }),
  ],
  transports: { [galileo.id]: http('https://evmrpc-testnet.0g.ai') },
})
