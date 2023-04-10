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
  totalSupply: number;
  genesisTs: number;
  launchTs: number;
  currentMaxTerm: number;
  currentEAAR: number;
  grossReward: number;
  savingRounds: number[],
  treasuryBalance: Balance | undefined,
  latestBlock: number,
  multiRounds: number[],
  mintValue: string,

  activeStakes: number;
  totalFrenStakedAmount: number;
  totalFrenStakedTerm: number;
  currentAPY: number;
}

const XENContext = createContext<IXENContext>({
  setChainOverride: (chain: Chain) => {},
  userMint: undefined,
  userStake: undefined,
  feeData: undefined,
  xenBalance: undefined,
  globalRank: 0,
  activeMinters: 0,
  totalSupply: 0,
  genesisTs: 0,
  launchTs: 0,
  currentMaxTerm: 0,
  currentEAAR: 0,
  grossReward: 0,

  savingRounds: [],
  treasuryBalance: emptyBalance(),
  latestBlock: 0,
  multiRounds: [],
  mintValue: "0",

  activeStakes: 0,
  totalFrenStakedAmount: 0,
  totalFrenStakedTerm: 0,
  currentAPY: 0,
});

export const XENProvider = ({ children }: any) => {
  const [chainOverride, setChainOverride] = useState<Chain | undefined>();
  const [userMint, setUserMint] = useState<UserMint | undefined>();
  const [userStake, setUserStake] = useState<UserStake | undefined>();
  const [feeData, setFeeData] = useState<FeeData | undefined>();
  const [xenBalance, setXenBalance] = useState<Balance | undefined>();
  const [globalRank, setGlobalRank] = useState(0);
  const [activeMinters, setActiveMinters] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [genesisTs, setGenesisTs] = useState(0);
  const [launchTs, setLaunchTs] = useState(0);
  const [currentMaxTerm, setCurrentMaxTerm] = useState(0);
  const [currentEAAR, setCurrentEAAR] = useState(0);
  const [grossReward, setGrossReward] = useState(0);
  const [mintValue, setMintValue] = useState("0");

  const [treasuryBalance, setTreasuryBalance] = useState<Balance>();

  const [savingRounds, setSavingRounds] = useState<number[]>([]);
  const [latestBlock, setLatestBlock] = useState<number>(0);

  const [multiRounds, setMultiRounds] = useState<number[]>([]);

  const [activeStakes, setActiveStakes] = useState(0);
  const [totalFrenStakedAmount, setTotalFrenStakedAmount] = useState(0);
  const [totalFrenStakedTerm, setTotalFrenStakedTerm] = useState(0);
  const [currentAPY, setCurrentAPY] = useState(0);

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
        functionName: "totalSupply",
      },
      {
        ...xenContract(chain),
        functionName: "genesisTs",
      },
      {
        ...xenContract(chain),
        functionName: "launchTs",
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentEAAR",
      },
      {
        ...xenContract(chain),
        functionName: "getGrossReward",
        args: [
          Number(globalRank) - (userMint?.rank.toNumber() ?? 0) > 2 ? Number(globalRank) - (userMint?.rank.toNumber() ?? 0) : 2,
          Number(userMint?.term ?? 0),
          1000 + Number(userMint?.eaaRate ?? 0),
        ],
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentMaxTerm",
      },
      {
        ...xenContract(chain),
        functionName: "timePrice",
      },
      {
        ...xenContract(chain),
        functionName: "activeStakes",
      },
      {
        ...xenContract(chain),
        functionName: "totalFrenStakedAmount",
      },
      {
        ...xenContract(chain),
        functionName: "totalFrenStakedTerm",
      },
      {
        ...xenContract(chain),
        functionName: "getCurrentAPY",
      },
    ],
    onSuccess(data) {
      setGlobalRank(Number(data[0]));
      setActiveMinters(Number(data[1]));
      setTotalSupply(Number(data[2]));
      setGenesisTs(Number(data[3]));
      setLaunchTs(Number(data[4]));
      setCurrentEAAR(Number(data[5]));
      setGrossReward(Number(data[6]));
      setCurrentMaxTerm(Number(data[7] ?? 100 * 86400));
      setMintValue(data[8] + "");

      setActiveStakes(Number(data[9]));
      setTotalFrenStakedAmount(Number(data[10]));
      setTotalFrenStakedTerm(Number(data[11]));
      setCurrentAPY(Number(data[12]));
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
      // setSavingRounds(data as number[]);
      let result = data as BigNumber[]
      if(result.length == 0) {
        return
      }

      let valData : number[] = [];
      valData.push(result[0].toNumber());

      for(var i=1; i<result.length; i++) {
        if(result[i].toNumber() >= valData[valData.length - 1]) {
          valData.push(result[i].toNumber());
        } else {
          for(var j=0; j<valData.length; j++) {
            if(result[i].toNumber() < valData[j]) {
              valData.splice(j, 0, result[i].toNumber());
              break;
            }
          }
        }
      }
      setSavingRounds(valData);
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
      //setMultiRounds(data as number[]);
      let result = data as BigNumber[]
      if(result.length == 0) {
        return
      }

      let valData : number[] = [];
      valData.push(result[0].toNumber());

      for(var i=1; i<result.length; i++) {
        if(result[i].toNumber() >= valData[valData.length - 1]) {
          valData.push(result[i].toNumber());
        } else {
          for(var j=0; j<valData.length; j++) {
            if(result[i].toNumber() < valData[j]) {
              valData.splice(j, 0, result[i].toNumber());
              break;
            }
          }
        }
      }
      setMultiRounds(valData);
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
        totalSupply,
        genesisTs,
        launchTs,
        currentMaxTerm,
        mintValue,
        currentEAAR,
        grossReward,
        savingRounds,
        treasuryBalance,
        latestBlock,
        multiRounds,
        activeStakes,
        totalFrenStakedAmount,
        totalFrenStakedTerm,
        currentAPY,
      }}
    >
      {children}
    </XENContext.Provider>
  );
};

export default XENContext;
