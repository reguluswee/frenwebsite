import { Chain } from "wagmi";

export const ethfMainnet: Chain = {
  id: 513100,
  name: "EthereumFair",
  network: "ethf mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "EthereumFair",
    symbol: "ETHF",
  },
  rpcUrls: {
    default: "https://rpc.etherfair.org",
  },
  blockExplorers: {
    default: { name: "ethfscan", url: "https://www.oklink.com/en/ethf" },
  },
  testnet: false,
};
