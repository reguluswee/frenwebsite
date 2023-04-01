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
  import { multiContract } from "~/lib/batch-contract";

  import { chainList } from "~/lib/client";
  import toast from "react-hot-toast";

  import { bool } from "yup";
  import React from "react";
import { xenContract } from "~/lib/xen-contract";

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

  export const SavingItem: NextPage<{mintData:any, round: number | undefined, len:number}> = ({ mintData, round, len }) => {
    const { t } = useTranslation("common");

    const { address } = useAccount();
    const chain = chainList[0];

    const timeNow = new Date().getTime() / 1000;
    const { data: globalRank } = useContractRead({
        ...xenContract(chain),
        functionName: "globalRank",
        // watch: true,
      });

    const { config, error } = usePrepareContractWrite({
        addressOrName: multiContract(chain).addressOrName,
        contractInterface:  multiContract(chain).contractInterface,
        functionName: "claimMintReward",
        args: [round],
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

    const handleClaim = (round: number | undefined, e: any) => {
        write?.()
    };

    useEffect(() => {
    }, [])

    return (
        <tr>
            <td>{Number(mintData.rank)}</td>
            <td>{Number(mintData.term)}</td>
            <td>
            {(len * estimatedXEN(Number(globalRank), {
                amplifier: mintData.amplifier,
                term: mintData.term,
                rank: mintData.rank,
            })).toFixed(0)}
            </td>
            <td>{len}</td>
            <td>{formatDate(Number(mintData.maturityTs))}</td>
            <td>
                <button
                    type="button"
                    onClick={handleClaim.bind(this, round)}
                    // disabled={timeNow <= mintData.maturityTs}
                    disabled={true}
                    className="btn btn-xs glass text-neutral ml-2"
                >
                    {t("batch.fop.action-claim")}
                </button>
            </td>
        </tr>
    );
  };

  export const SavingRound: NextPage<{round: number | undefined, len: number, minter: string}> = ({round, len, minter}) => {
    const chain = chainList[0];
    const { data : tokenData } = useContractRead({
        ...xenContract(chain),
        functionName: "userMints",
        args: [minter],
    })
    if(!tokenData) {
        return <></>
    }
    return (<SavingItem round={round} len={len} mintData={tokenData}></SavingItem>)
  }

  export const WSavingItem: NextPage<{round: number | undefined}> = ({ round }) => {
    const chain = chainList[0];
    
    const { data:mintData } = useContractRead({
        ...multiContract(chain),
        functionName: "getRoundBots",
        args: [BigNumber.from(round).toNumber()],
    });
    
    if (!mintData || mintData.length==0) {
        return <></>
    }
    let mintAddr : string = mintData[0];
    
    return (<SavingRound round={round} len={mintData.length} minter={mintAddr}></SavingRound>)
  }