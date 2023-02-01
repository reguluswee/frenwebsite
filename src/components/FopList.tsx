import {
    Chain,
    useNetwork,
    useAccount,
    useContractRead,
    useContractWrite,
    useWaitForTransaction,
    usePrepareContractWrite,
    useContractEvent,
  } from "wagmi";
  import { BigNumber, ethers } from "ethers";
  import { serverSideTranslations } from "next-i18next/serverSideTranslations";
  import Container from "~/components/containers/Container";
  import { useRouter } from "next/router";
  import { useEffect, useState, useContext, Children } from "react";
  import { useTranslation } from "next-i18next";
  import XENContext from "~/contexts/XENContext";
  import { UTC_TIME, estimatedXEN, formatDate } from "~/lib/helpers";
  import type { NextPage } from "next";
  import { batchV1Contract, batchV2Contract, fopV1Contract, fopV2Contract } from "~/lib/batch-contract";
  import {
    batchV1Abi, batchV1Address, optNFTV1Abi, optNFTV1Address,
    batchV2Abi, batchV2Address, optNFTV2Abi, optNFTV2Address,
  } from "~/abi/BatchABI";
  import { chainList } from "~/lib/client";
  import toast from "react-hot-toast";

  import { bool } from "yup";
  import React from "react";

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

  export const FopItem: NextPage<{tokenData:any, tokenId: number | undefined, owner: string, version: string}> = ({ tokenData, tokenId, owner, version }) => {
    const { t } = useTranslation("common");

    const { address } = useAccount();
    const { globalRank } = useContext(XENContext);

    const timeNow = new Date().getTime() / 1000;

    let contabi = batchV2Abi;
    let contaddress = batchV2Address;
    if(version=='v1') {
        contabi = batchV1Abi;
        contaddress = batchV1Address;
    }
    const { config, error } = usePrepareContractWrite({
        addressOrName: contaddress,
        contractInterface: contabi,
        functionName: "claimMintReward",
        args: [tokenId],
        overrides: {
            from: address,
            gasLimit: 30000000,
        }
    });
    const { data, isError, isLoading, write } = useContractWrite({
        ...config,
        onSuccess(data) {
            // setProcessing(true);
            // setDisabled(true);
        },
    });

    const handleClaim = (token:any, tokenId: number, version: string, e: any) => {
        write?.()
        // const {} = useWaitForTransaction({
        //     hash: claimRankData?.hash,
        //     onSuccess(data) {
        //         toast(t("toast.claim-successful"));
        //         router.push("/batch/fop");
        //     },
        // });
    };

    const handleView = (token:any, tokenId: number, version: string, e:any) => {
        let prefix = 'https://musse.io/#/detail/'
        if (version=='v1') {
            prefix = prefix + '0xa5e5e2506392b8467a4f75b6308a79c181ab9fbf:'
        } else if(version=='v2') {
            prefix = prefix + '0x3a02488875719258475d44601685172c213510b4:'
        }
        const w = window.open('about:blank');
        if(w) {
            w.location.href = prefix + tokenId;
        }
    }

    useEffect(() => {
    }, [])

    return (
        <tr>
            <td>{tokenData[1].cRank?.toString()}</td>
            <td>{tokenData[1].term?.toString()}</td>
            <td>{(tokenData[1].pMinters?.length * estimatedXEN(globalRank, {
                amplifier: tokenData[1].amp,
                term: tokenData[1].term,
                rank: tokenData[1].cRank,
            })).toFixed(0)}</td>
            <td>{tokenData[1].pMinters?.length}</td>
            <td>{formatDate(tokenData[1].maturityTs)}</td>
            <td>
                <button
                    type="button"
                    onClick={handleClaim.bind(this, tokenData[1], tokenId, version)}
                    disabled={timeNow < tokenData[1].maturityTs}
                    className="btn btn-xs glass text-neutral ml-2"
                >
                    {t("batch.fop.action-claim")}
                </button>
                <br/>
                <button
                    type="button"
                    onClick={handleView.bind(this, tokenData[1], tokenId, version)}
                    disabled={timeNow > tokenData[1].maturityTs}
                    className="btn btn-xs glass text-neutral ml-2"
                >
                    {t("batch.fop.action-view")}
                </button>
            </td>
        </tr>
    );
  };

  export const WFopItem: NextPage<{tokenId: number | undefined, owner: string, version: string}> = ({ tokenId, owner, version }) => {
    const chain = chainList[0];
    
    const { data:tokenData } = useContractRead({
        ...fopV2Contract(chain),
        functionName: "ownerOfWithPack",
        overrides: { from: owner },
        args: [tokenId],
    });
    
    if (!tokenData || !tokenData[0] || tokenData[1].minter!=owner) {
        return <></>
    }
    return (<FopItem tokenId={tokenId} owner={owner} version={version} tokenData={tokenData}></FopItem>)
  }