import { Chain, chain } from "wagmi";

import { ethfMainnet } from "~/lib/chains/ethfMainnet";
import {
    batchV1Abi, batchV1Address, optNFTV1Abi, optNFTV1Address,
    batchV2Abi, batchV2Address, optNFTV2Abi, optNFTV2Address,
    batchSavingAbi, batchSavingAddress,
    multiAbi, multiAddress,
  } from "~/abi/BatchABI";

export const batchV1Contract = (contractChain?: Chain) => {
    return {
        addressOrName: batchV1Address,
        contractInterface: batchV1Abi,
        chainId: contractChain?.id,
    };
};
export const fopV1Contract = (contractChain?: Chain) => {
    return {
        addressOrName: optNFTV1Address,
        contractInterface: optNFTV1Abi,
        chainId: contractChain?.id,
    };
};

export const batchV2Contract = (contractChain?: Chain) => {
    return {
        addressOrName: batchV2Address,
        contractInterface: batchV2Abi,
        chainId: contractChain?.id,
    };
};
export const fopV2Contract = (contractChain?: Chain) => {
    return {
        addressOrName: optNFTV2Address,
        contractInterface: optNFTV2Abi,
        chainId: contractChain?.id,
    };
};

export const batchSavingContract = (contractChain?: Chain) => {
    return {
        addressOrName: batchSavingAddress,
        contractInterface: batchSavingAbi,
        chainId: contractChain?.id,
    };
}

export const multiContract = (contractChain?: Chain) => {
    return {
        addressOrName: multiAddress,
        contractInterface: multiAbi,
        chainId: contractChain?.id,
    };
}