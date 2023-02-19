import React, { createContext, useState } from "react";
import { Chain, useFeeData, useBalance, useAccount, useNetwork, useContractRead, useContractReads, useBlockNumber } from "wagmi";
import { BigNumber } from "ethers";
import { chainList } from "~/lib/client";
import { xenContract } from "~/lib/xen-contract";

import { batchSavingContract, multiContract } from "~/lib/batch-contract";
import { ethers } from "ethers";
import {
  optNFTV1Abi, optNFTV1Address,
  optNFTV2Abi, optNFTV2Address,
} from "~/abi/BatchABI";

const provider = new ethers.providers.JsonRpcProvider("https://rpc.etherfair.org")
const nftV2 = new ethers.Contract(optNFTV2Address, optNFTV2Abi, provider);
const nftV1 = new ethers.Contract(optNFTV1Address, optNFTV1Abi, provider);

const treasuryContract = "0x73d24160cBE2145c68466cc8940fcd34f6614576";

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

export interface UserMint {
  user: string;
  amplifier: BigNumber;
  eaaRate: BigNumber;
  maturityTs: BigNumber;
  rank: BigNumber;
  term: BigNumber;
}

export interface UserStake {
  amount: BigNumber;
  apy: BigNumber;
  maturityTs: BigNumber;
  term: BigNumber;
}

export interface Formatted {
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface FeeData {
  formatted: Formatted;
  gasPrice: BigNumber;
  lastBaseFeePerGas: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
}

export interface Balance {
  decimals: number;
  formatted: string;
  symbol: string;
  value: BigNumber;
}

const emptyBalance = () => {
  return {
    decimals: 0,
    formatted: "",
    symbol: "",
    value: BigNumber.from(0)
  }
}

interface IXENContext {
  setChainOverride: (chain: Chain) => void;
  userMint?: UserMint;
  userStake?: UserStake;
  feeData?: FeeData;
  xenBalance?: Balance;
  globalRank: number;
  activeMinters: number;
  activeStakes: number;
  totalXenStaked: number;
  totalSupply: number;
  genesisTs: number;
  currentMaxTerm: number;
  currentAMP: number;
  currentEAAR: number;
  currentAPY: number;
  grossReward: number;
  mintValue: number;

  savingRounds: number[],
  treasuryBalance: Balance | undefined,
  latestBlock: number,
  multiRounds: number[],
}

const XENContext = createContext<IXENContext>({
  setChainOverride: (chain: Chain) => {},
  userMint: undefined,
  userStake: undefined,
  feeData: undefined,
  xenBalance: undefined,
  globalRank: 0,
  activeMinters: 0,
  activeStakes: 0,
  totalXenStaked: 0,
  totalSupply: 0,
  genesisTs: 0,
  currentMaxTerm: 0,
  currentAMP: 0,
  currentEAAR: 0,
  currentAPY: 0,
  grossReward: 0,
  mintValue: 0,

  savingRounds: [],
  treasuryBalance: emptyBalance(),
  latestBlock: 0,
  multiRounds: [],
});

export const XENProvider = ({ children }: any) => {
  const [chainOverride, setChainOverride] = useState<Chain | undefined>();
  const [userMint, setUserMint] = useState<UserMint | undefined>();
  const [userStake, setUserStake] = useState<UserStake | undefined>();
  const [feeData, setFeeData] = useState<FeeData | undefined>();
  const [xenBalance, setXenBalance] = useState<Balance | undefined>();
  const [globalRank, setGlobalRank] = useState(0);
  const [activeMinters, setActiveMinters] = useState(0);
  const [activeStakes, setActiveStakes] = useState(0);
  const [totalXenStaked, setTotalXenStaked] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [genesisTs, setGenesisTs] = useState(0);
  const [currentMaxTerm, setCurrentMaxTerm] = useState(0);
  const [currentAMP, setCurrentAMP] = useState(0);
  const [currentEAAR, setCurrentEAAR] = useState(0);
  const [currentAPY, setCurrentAPY] = useState(0);
  const [grossReward, setGrossReward] = useState(0);

  const [mintValue, setMintValue] = useState(0);
  const [treasuryBalance, setTreasuryBalance] = useState<Balance>();

  const [savingRounds, setSavingRounds] = useState<number[]>([]);
  const [latestBlock, setLatestBlock] = useState<number>(0);

  const [multiRounds, setMultiRounds] = useState<number[]>([]);

  const { address } = useAccount();
  const { chain: networkChain } = useNetwork();

  const chain = chainOverride ?? networkChain ?? chainList[0];

  useBalance({
    addressOrName: address,
    token: xenContract(chain).addressOrName,
    onSuccess(data) {
      setXenBalance({
        decimals: data.decimals,
        formatted: data.formatted,
        symbol: data.symbol,
        value: data.value,
      });
    },
    // watch: true,
  });
  useBalance({
    addressOrName: treasuryContract,
    onSuccess(data) {
      setTreasuryBalance({
        decimals: data.decimals,
        formatted: data.formatted,
        symbol: data.symbol,
        value: data.value,
      });
    }
  })

  useContractRead({
    ...xenContract(chain),
    functionName: "getUserMint",
    overrides: { from: address },
    onSuccess(data) {
      setUserMint({
        user: data.user,
        amplifier: data.amplifier,
        eaaRate: data.eaaRate,
        maturityTs: data.maturityTs,
        rank: data.rank,
        term: data.term,
      });
    },
    enabled: address != null,
    cacheOnBlock: true,
    // watch: true,
  });

  useContractRead({
    ...xenContract(chain),
    functionName: "getUserStake",
    overrides: { from: address },
    onSuccess(data) {
      setUserStake({
        amount: data.amount,
        apy: data.apy,
        maturityTs: data.maturityTs,
        term: data.term,
      });
    },
    enabled: address != null,
    cacheOnBlock: true,
    // watch: true,
  });

  useContractReads({
    contracts: [
      {
        ...xenContract(chain),
        functionName: "globalRank",
      },
      {
        ...xenContract(chain),
        functionName: "activeMinters",
      },
      {
        ...xenContract(chain),
        functionName: "activeStakes",
      },
      {
        ...xenContract(chain),
        functionName: "totalXenStaked",
      },
      {
        ...xenContract(chain),
        functionName: "totalSupply",
      },
      {
        ...xenContract(chain),
        functionName: "genesisTs",
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentMaxTerm",
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentAMP",
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentEAAR",
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentAPY",
      },
      {
        ...xenContract(chain),
        functionName: "getGrossReward",
        args: [
          Number(globalRank) - (userMint?.rank.toNumber() ?? 0),
          Number(userMint?.amplifier ?? 0),
          Number(userMint?.term ?? 0),
          1000 + Number(userMint?.eaaRate ?? 0),
        ],
      },
      {
        ...xenContract(chain),
        functionName: "mintValue",
      },
    ],
    onSuccess(data) {
      setGlobalRank(Number(data[0]));
      setActiveMinters(Number(data[1]));
      setActiveStakes(Number(data[2]));
      setTotalXenStaked(Number(data[3]));
      setTotalSupply(Number(data[4]));
      setGenesisTs(Number(data[5]));
      setCurrentMaxTerm(Number(data[6] ?? 100 * 86400));
      setCurrentAMP(Number(data[7]));
      setCurrentEAAR(Number(data[8]));
      setCurrentAPY(Number(data[9]));
      setGrossReward(Number(data[10]));
      setMintValue(Number(data[11]));
    },
    cacheOnBlock: true,
    watch: true,
  });

  useFeeData({
    formatUnits: "gwei",
    onSuccess(data) {
      setFeeData({
        formatted: {
          gasPrice: data.formatted.gasPrice ?? "",
          maxFeePerGas: data.formatted.maxFeePerGas ?? "",
          maxPriorityFeePerGas: data.formatted.maxPriorityFeePerGas ?? "",
        },
        gasPrice: data.gasPrice ?? BigNumber.from(0),
        lastBaseFeePerGas: data.lastBaseFeePerGas ?? BigNumber.from(0),
        maxFeePerGas: data.maxFeePerGas ?? BigNumber.from(0),
        maxPriorityFeePerGas: data.maxPriorityFeePerGas ?? BigNumber.from(0),
      });
    },
    // watch: true,
  });

  useContractRead({
    ...batchSavingContract(chain),
    functionName: "getMintingData",
    overrides: { from: address },
    args: [address],
    onSuccess(data) {
      setSavingRounds(data as number[]);
    },
    enabled: address != null,
    cacheOnBlock: true,
    // watch: true,
  });

  useContractRead({
    ...multiContract(chain),
    functionName: "getMintingData",
    overrides: { from: address },
    args: [address],
    onSuccess(data) {
      setMultiRounds(data as number[]);
    },
    enabled: address != null,
    cacheOnBlock: true,
    // watch: true,
  });

  const blockNumber = useBlockNumber({
    onBlock(blockNumber) {
      setLatestBlock(blockNumber);
    },
  })

  return (
    <XENContext.Provider
      value={{
        setChainOverride,
        userMint,
        userStake,
        feeData,
        xenBalance,
        globalRank,
        activeMinters,
        activeStakes,
        totalXenStaked,
        totalSupply,
        genesisTs,
        currentMaxTerm,
        currentAMP,
        currentEAAR,
        currentAPY,
        grossReward,
        mintValue,
        savingRounds,
        treasuryBalance,
        latestBlock,
        multiRounds,
      }}
    >
      {children}
    </XENContext.Provider>
  );
};

export default XENContext;
