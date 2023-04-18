import {
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePrepareContractWrite,
  erc20ABI,
  useContractRead,
} from "wagmi";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "~/components/containers/Container";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

import CardContainer from "~/components/containers/CardContainer";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { clsx } from "clsx";

import { UTC_TIME, formatFullDate } from "~/lib/helpers";

import toast from "react-hot-toast";
import { BigNumber } from "ethers";

const comAbi = [{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"code","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"xenContract","type":"address"},{"indexed":true,"internalType":"address","name":"tokenContract","type":"address"},{"indexed":false,"internalType":"uint256","name":"xenAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"Redeemed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"code","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfered","type":"event"},{"inputs":[],"name":"NEWFREN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"PREFREN","outputs":[{"internalType":"contract PreFren","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimData","outputs":[{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"done","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"strictTrans","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_check","type":"bool"}],"name":"modifyStrict","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"name":"modifyRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"drawback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_maturityTs","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"checkHolder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"onTokenBurned","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_holder","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_maturityTs","type":"uint256"}],"name":"leaf","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_maturityTs","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"transfer","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const comAddr = "0x37d34272956290B80D0279B42B6eF720F9416A1D";
const bgdec = BigNumber.from(10**18 + '');

//const address = "0x437F552E716B15074689A7635a820b3Df4201994"

const MapStake = () => {
  const { t } = useTranslation("common");

  // const { address } = useAccount();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [errMsg, setErrMsg] = useState("");

  const [availableAmountStr, setAvailableAmountStr] = useState("0");
  const [availableAmount, setAvailableAmount] = useState(BigNumber.from("0"));
  const [proof, setProof] = useState<string>("")
  const [maturityTs, setMaturityTs] = useState(0);

  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>(BigNumber.from(0));
  const [claimStatus, setClaimStatus] = useState(0);
  const [tipMsg, setTipMsg] = useState("");
  const [btnName, setBtnName] = useState<string>(t("mapping.staking.btn.approve"));
  const [available, setAvailable] = useState(false)
  const [step, setStep] = useState(1)

  const {
    handleSubmit,
  } = useForm({
    mode: "onChange",
  });

  /*** CONTRACT WRITE SETUP ***/
  const { config: _20config, error: _20error } = usePrepareContractWrite({
    addressOrName: '0x7127deeff734cE589beaD9C4edEFFc39C9128771',
    contractInterface: erc20ABI,
    functionName: "approve",
    args: [comAddr, availableAmountStr],
  })
  const { data: approveData, write: approveWrite } = useContractWrite({
    ..._20config,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const {} = useContractRead({
    addressOrName: '0x7127deeff734cE589beaD9C4edEFFc39C9128771',
    contractInterface: erc20ABI,
    functionName: "allowance",
    overrides: { from: address },
    args: [address, comAddr],
    onSuccess(data) {
      setTokenAllowance(BigNumber.from(data));
    }
  })

  const {} = useContractRead({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "claimData",
    overrides: { from: address },
    args: [address],
    onSuccess(data) {
      if(data.done) {
        setClaimStatus(2)
        setStep(3)
      } else {
        if(Number(data.amount)==0) {
          setClaimStatus(0)
          setStep(1)
        } else {
          setClaimStatus(1)
          setStep(2)
        }
      }
    }
  })

  const {} = useContractRead({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "checkHolder",
    overrides: { from: address },
    args: [availableAmountStr, maturityTs, JSON.parse(proof=="" ? "[]" : proof)],
    onSuccess(data) {
      if(data) {
        setAvailable(true)
      }
    },
    onError(e) {
      console.log("checkholder error", e)
    }
  })

  const { config: _claimConfig, error: _claimerror } = usePrepareContractWrite({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "claim",
    args: [availableAmountStr, maturityTs, JSON.parse(proof==""?"[]":proof)],
    onSuccess(data) {
    },
    onError(e) {
      //console.log("是这里的问题？", e)
      setDisabled(true)
      setErrMsg(t("mapping.general.old-balance-burn-invalid"))
    }
  })

  const { data: _claimData, write: writeClaim } = useContractWrite({
    ..._claimConfig,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });

  const { config: _tranConfig, error: _transferError } = usePrepareContractWrite({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "transfer",
    overrides: { from: address },
    onError(e) {
      console.log("address error:", address, e)
    }
  })

  const { data: _tranData, write: writeTransfer } = useContractWrite({
    ..._tranConfig,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const {} = useWaitForTransaction({
    hash: step==1 ? approveData?.hash : (step==2 ? _claimData?.hash : _tranData?.hash),
    onSuccess(data) {
      if(step==1) {
        setStep(2)
        setDisabled(false)
        setProcessing(false)
        setBtnName(t("mapping.staking.btn.confirm"))
      } else if(step==2) {
        setStep(3)
        setDisabled(false)
        setProcessing(false)
        setClaimStatus(1)
        setBtnName(t("mapping.staking.btn.claim"))
      } else {
        setDisabled(true)
        setProcessing(false)
        setClaimStatus(2)
        setBtnName(t("mapping.staking.btn.claim"))
        setTipMsg(t("mapping.staking.transfered"))
        setAvailableAmount(BigNumber.from("0"))
        setAvailableAmountStr("0")
      }
    },
  });

  const onSubmit = () => {
    if(claimStatus==2) {
      toast(t("mapping.general.transfered"));
      return;
    }
    if(step==1) {
      approveWrite?.();
    } else if(step==2) {
      writeClaim?.();
    } else if(step==3) {
      writeTransfer?.();
    }
  };

  /*** USE EFFECT ****/

  useEffect(() => {
    if (!processing) {
      setDisabled(false);
    }
    fetch("/apc/upgrade/getstake", {
      method: "POST",
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'address=' + address
    }).then( res => {
      if(res.ok) {
        return res.json()
      }
      throw res;
    }).then( data => {
      if(data.Code == 0) {
        setAvailableAmount(data.Data?.RewardAmount? BigNumber.from(data.Data.RewardAmount) : BigNumber.from(0))
        setAvailableAmountStr(data.Data?.RewardAmount)
        setProof(JSON.stringify(data.Data?.Proof ? data.Data.Proof : "[]"))          
        setMaturityTs(data.Data?.MaturityTs ? Number(data.Data?.MaturityTs) : 0)
      }
    }).catch(err => {
      setErrMsg(err)
    })

    if(!available) {
      setDisabled(true)
      setTipMsg(t("mapping.general.noavailable"))
    } else {
      setTipMsg("" + claimStatus + ":" + step)
      if(claimStatus==0) {
        let avBig = BigNumber.from(availableAmountStr)
        if(!(avBig.gt(tokenAllowance))) {
          setDisabled(false)
          setBtnName(t("mapping.staking.btn.confirm"))
          setStep(2)
        }
      } else if(claimStatus==1) {
        setBtnName(t("mapping.staking.btn.claim"))
        setStep(3)
      } else {
        setDisabled(true)
        setTipMsg(t("mapping.general.transfered"))
        setAvailableAmount(BigNumber.from("0"))
        setAvailableAmountStr("0")
      }
    }
    if(maturityTs > new Date().getTime()/1000) {
      setTipMsg(t("mapping.general.not-in-time"));
    }
  }, [
    address,
    // _20config,
    processing,
    disabled,
    // availableAmount,
    // availableAmountStr,
    // proof,
    // btnName,
    // tipMsg,
    // errMsg,
    step,
    tokenAllowance,
    claimStatus,
    available
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
        <ul className="steps w-full">
          <Link href="/v1/mapping/direct">
            <a className="step">{t("mapping.direct.title")}</a>
          </Link>

          <Link href="/v1/mapping/staking">
            <a className="step step-neutral">{t("mapping.staking.title")}</a>
          </Link>

          <Link href="/v1/mapping/mining">
            <a className="step">{t("mapping.mining.title")}</a>
          </Link>
        </ul>

        <CardContainer>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">
              {t("mapping.staking.tip")}
              </h2>
              <div className="form-control w-full">
                  <label className="label text-neutral">
                      <span className="label-text text-neutral">{t("mapping.staking.form.amount")}</span>
                      <span className="label-text-alt text-error">{errMsg}</span>
                  </label>
                  <label className="label">
                      <span className="input input-bordered w-full text-neutral">{claimStatus==2 ? 0 : (availableAmount.div(bgdec)).toString()}</span>
                  </label>
              </div>
              <div className="form-control w-full">
                  <label className="label text-neutral">
                      <span className="label-text text-neutral">{t("mapping.staking.form.maturityTs")}</span>
                  </label>
                  <label className="label">
                      <span className="input input-bordered w-full text-neutral">{formatFullDate(maturityTs)}</span>
                  </label>
              </div>
              

              <div className="form-control w-full">
              <label className="label">
                <span className="label-text-alt text-neutral">{tipMsg}</span>
                </label>
                <button
                  type="submit"
                  className={clsx("btn glass text-neutral", {
                    loading: processing,
                  })}
                  disabled= {disabled}
                  // {claimStatus==2 || availableAmount==0 ? true : disabled}
                >
                  {/* {claimStatus == 0 ? t("mapping.direct.btn.confirm") : (claimStatus==1 ? t("mapping.direct.btn.claim") : "claimed")} */}
                  {btnName}
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
  
export default MapStake;