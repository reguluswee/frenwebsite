import React, { createContext, useState } from "react";
import { Chain, useFeeData, useBalance, useAccount, useNetwork, useContractRead, useContractReads } from "wagmi";
import { BigNumber } from "ethers";
import { chainList } from "~/lib/client";
import { batchV1Contract, fopV1Contract, batchV2Contract, fopV2Contract } from "~/lib/batch-contract";
import { ethers } from "ethers";
import {
  batchV1Abi, batchV1Address, optNFTV1Abi, optNFTV1Address,
  batchV2Abi, batchV2Address, optNFTV2Abi, optNFTV2Address,
} from "~/abi/BatchABI";

const provider = new ethers.providers.JsonRpcProvider("https://rpc.etherfair.org")
const nftV2 = new ethers.Contract(optNFTV2Address, optNFTV2Abi, provider);
const filterTo = nftV2.filters.Transfer(null, '0xb319d3d7f3e9034204bf9e461b2da09f4a8d7100')

export interface FopObj {
  minter: string,
  amp?: number,
  cRank?: number,
  eaaRate?: number,
  maturityTs?: number,
  term?: number,
  tokenId?: number,
  pMinters?: string[],
  version: string,
  canTransfer?: number,
}

interface IFopContext {
  setChainOverride: (chain: Chain) => void;
  fopV2List: FopObj[] | undefined;
  v2Balance: number;
}

const FopContext = createContext<IFopContext>({
  setChainOverride: (chain: Chain) => {},
  fopV2List: undefined,
  v2Balance: 0,
});

export const FopProvider = ({ children }: any) => {
  const [chainOverride, setChainOverride] = useState<Chain | undefined>();
  const [fopV2List, setFopV2List] = useState<FopObj[] | undefined>();
  const [v2Balance, setV2Balance] = useState(0);

  const { address } = useAccount();
  const { chain: networkChain } = useNetwork();

  const chain = chainOverride ?? networkChain ?? chainList[0];

  useBalance({
    addressOrName: address,
    token: fopV2Contract(chain).addressOrName,
    onSuccess(data) {
      console.log('v1的余额', data)
      setV2Balance(15);
    },
    // watch: true,
  });

  const fil = async () => {
    const logs = await nftV2.queryFilter(filterTo, 16079829, 16421385)
    let tmpo = {} as FopObj
    tmpo.minter = address || '';
    tmpo.version = "v2";
    const resultData : FopObj[] = [];
    logs.map((item, index) => {
        tmpo.tokenId = BigNumber.from(item.topics[3]).toNumber();
        resultData.push(tmpo);
    })
    setFopV2List(resultData);
  }
  fil()
  
  return (
    <FopContext.Provider
      value={{
        setChainOverride,
        fopV2List,
        v2Balance,
      }}
    >
      {children}
    </FopContext.Provider>
  );
};

export default FopContext;
