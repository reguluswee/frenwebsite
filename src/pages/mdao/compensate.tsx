import {
    useNetwork,
    useAccount,
    useContractWrite,
    useWaitForTransaction,
    usePrepareContractWrite,
    erc20ABI,
    useContractRead,
  } from "wagmi";
  
  import { serverSideTranslations } from "next-i18next/serverSideTranslations";
  import Container from "~/components/containers/Container";
  import { useRouter } from "next/router";
  import { useEffect, useState, useContext } from "react";
  import { useTranslation } from "next-i18next";
  import XENContext from "~/contexts/XENContext";
  import { UTC_TIME } from "~/lib/helpers";
  
  import CardContainer from "~/components/containers/CardContainer";
  import Link from "next/link";
  import { MaxValueField, MaxMinterField, TokenSelection } from "~/components/FormFields";
  import { InformationCircleIcon } from "@heroicons/react/outline";
  import { DateStatCard, NumberStatCard } from "~/components/StatCards";
  import { useForm } from "react-hook-form";
  import { xenContract } from "~/lib/xen-contract";
  import { ErrorMessage } from "@hookform/error-message";
  import { yupResolver } from "@hookform/resolvers/yup";
  import { clsx } from "clsx";
  import * as yup from "yup";
  import toast from "react-hot-toast";
  import GasEstimate from "~/components/GasEstimate";
  
  import { WSavingItem } from "~/components/MultiList";
  import { ethers, BigNumber } from "ethers";
  
  import { multiContract } from "~/lib/batch-contract";

  const comAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"wallet","type":"address"},{"indexed":true,"internalType":"uint256","name":"term","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"ethfCost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"frenLoss","type":"uint256"}],"name":"ClaimCompensate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"wallet","type":"address"},{"indexed":true,"internalType":"uint256","name":"term","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"ethfCost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"frenLoss","type":"uint256"}],"name":"GetCompensate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"CUTOFFTS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"FRENPROXY","outputs":[{"internalType":"contract FrenMint","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"MAX_PENALTY_PCT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"MDAOPROXY","outputs":[{"internalType":"contract MdaoBathProxy","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"PENALTY_DAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"SECONDS_IN_DAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"WITHDRAWAL_WINDOW_DAYS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"ethCostData","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"frenLossData","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"recordData","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"stage","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"startBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive","payable":true},{"inputs":[{"internalType":"uint256","name":"term","type":"uint256"}],"name":"computeTermIssue","outputs":[{"internalType":"uint256","name":"ethfCost","type":"uint256"},{"internalType":"uint256","name":"frenLoss","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"term","type":"uint256"}],"name":"claimTermIssue","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"term","type":"uint256"}],"name":"getTermIssue","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_stage","type":"uint256"}],"name":"coolStage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];
  const comAddr = "0x2b3A420591a8be037AbE6DDf9Af4Ec7b433e0492";
  
  const Compensate = () => {
    const { t } = useTranslation("common");
  
    const { address } = useAccount();
    const { chain } = useNetwork();
    const router = useRouter();
    const [disabled, setDisabled] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [term, setTerm] = useState(0);
    const [termAmount, setTermAmount] = useState(0);

    const [errMsg, setErrMsg] = useState("");

    const {
        handleSubmit,
      } = useForm({
        mode: "onChange",
      });
  
    /*** CONTRACT WRITE SETUP ***/
    const { config: _20config, error: _20error } = usePrepareContractWrite({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "claimTermIssue",
      args: [term],
    })

    const {} = useContractRead({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "computeTermIssue",
      overrides: { from: address },
      args: [term],
      onSuccess(data) {
        if(term != 0) {
            if(Number(data) == 0) {
                setErrMsg("no available issue found.")
            } else {
                setTermAmount(Number(data));
            }
        }
      }
    })

    const { data: cliamIssueData, write } = useContractWrite({
      ..._20config,
      onSuccess(data) {
        setProcessing(true);
        setDisabled(true);
      },
    });
    const {} = useWaitForTransaction({
      hash: cliamIssueData?.hash,
      onSuccess(data) {
        toast(t("toast.approve-successful"));
      },

    });
    const onSubmit = () => {
        write?.();
    };
  
    /*** USE EFFECT ****/
  
    useEffect(() => {
      if (!processing) {
        setDisabled(false);
      }

      setDisabled(true);
    }, [
      address,
      _20config,
      processing,
    ]);
  
    return (
      <Container className="max-w-2xl">
        <div className="flew flex-row space-y-8 ">
          <ul className="steps w-full">
            <Link href="/batch/fop">
              <a className="step step-neutral">test and compute</a>
            </Link>
  
            <Link href="/batch/saving">
              <a className="step">collecting</a>
            </Link>

            <Link href="/multi/tokens">
              <a className="step">compensate</a>
            </Link>
          </ul>
  
          <CardContainer>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">
                  Fren offers this tools to compensate our friends who loss their $fren because used MemorySwap Batch Tool
                </h2>
                <div className="form-control w-full">
                    <label className="label text-neutral">
                        <span className="label-text text-neutral">Term</span>
                        <span className="label-text-alt text-error">{errMsg}</span>
                    </label>
                    <input
                        type="number"
                        placeholder="1"
                        className="input input-bordered w-full text-neutral"
                        value={term}
                        onChange={e => setTerm(Number(e.target.value))}
                    />
                    <label className="label">
                        <span className="label-text-alt text-neutral">Total Term Loss</span>
                        <span className="label-text-alt text-neutral">{termAmount}</span>
                    </label>
                </div>
  
                <div className="form-control w-full">
                  <button
                    type="submit"
                    className={clsx("btn glass text-neutral", {
                      loading: processing,
                    })}
                    disabled={disabled}
                  >
                    Claim My Loss
                  </button>
                </div>
              </div>
            </form>
          </CardContainer>
        </div>
      </Container>
    );
  }
export async function getStaticProps({ locale }: any) {
      return {
        props: {
          ...(await serverSideTranslations(locale, ["common"])),
        },
      };
    }
    
export default Compensate;