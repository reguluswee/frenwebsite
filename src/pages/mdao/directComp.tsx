import {
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePrepareContractWrite,
  erc20ABI,
  useContractRead,
} from "wagmi";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "~/components/containers/Container";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next";

import CardContainer from "~/components/containers/CardContainer";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { clsx } from "clsx";

import { formatDate } from "~/lib/helpers";

import toast from "react-hot-toast";
import { BigNumber } from "ethers";

const comAbi = [{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"MdaoComp","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"NEWFREN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimData","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"name":"modifyRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"drawback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_holder","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"leaf","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"checkHolder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const comAddr = "0x5fa6935cf06eDf5B368ed2A85982E05b51BB0E3C";
const bgdec = BigNumber.from(10**18 + '');
const timeNow = new Date().getTime() / 1000;

export interface MiningRecord {
  OwnerAddress: string,
  ProxyNum: number,
  Round: number,
  Term: number,
  MaturityTs: number,
  Rewards: BigNumber,
  Tc: number,
  claimProcessing: boolean,
  claimDisabled: boolean,
}

const DirectComp = () => {
  const { t } = useTranslation("common");

  const approveAmount = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

  const { address } = useAccount();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [availableAmount, setAvailableAmount] = useState(BigNumber.from(0))
  
  const [tipMsg, setTipMsg] = useState("");

  const [remainBalance, setRemainBalance] = useState(BigNumber.from(0));

  const [dataJson, setDataJson] = useState("[]");

  const {
    handleSubmit,
  } = useForm({
    mode: "onChange",
  });

  /*** CONTRACT WRITE SETUP ***/
  const {} = useContractRead({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "checkHolder",
    overrides: { from: address },
    args: [availableAmount, JSON.parse(dataJson)],
    onSuccess(data) {
      console.log("check holder：", data, availableAmount, dataJson)
      if(!data) {
        setDisabled(true)
      }
    }
  })

  const {} = useContractRead({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "claimData",
    overrides: { from: address },
    args: [address],
    onSuccess(data) {
      console.log("claimed amount", data)
      if(BigNumber.from(data).gt(BigNumber.from(0))) {
        setDisabled(true)
      }
    }
  })

  const {} = useContractRead({
    addressOrName: "0xf81ed9cecFE069984690A30b64c9AAf5c0245C9F",
    contractInterface: erc20ABI,
    functionName: "balanceOf",
    args: [comAddr],
    onSuccess(data) {
      setRemainBalance(BigNumber.from(data))
      if(!remainBalance.gte(availableAmount)) {
        setTipMsg("compensate contract balance is not enough, please wait for recharging")
      } else {
        setTipMsg("")
      }
    }
  })

  const { config: _claimConfig, error: _claimerror } = usePrepareContractWrite({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "claim",
    overrides: { from: address },
    args: [availableAmount, JSON.parse(dataJson)],
    onSuccess(data) {
    },
  })

  const { data: _claimData, write: claimWrite } = useContractWrite({
    ..._claimConfig,
    onSuccess(data) {
      console.log("success？")
    },
    onError(e) {
      setProcessing(false)
      setDisabled(false)
    }
  });

  const {} = useWaitForTransaction({
    hash: _claimData?.hash,
    onSuccess(data) {
      toast("Success")
      setDisabled(true)
    },
  });

  const onSubmit = () => {
    if(remainBalance.gte(availableAmount)) {
      claimWrite?.();
    } else {
      setTipMsg("compensate contract balance is not enough, please wait for recharging")
    }
    // const signMsg = 'please verify you are the owner of wallet:';
    // signMessage({ message: signMsg + address })
  };

  /*** USE EFFECT ****/

  useEffect(() => {
    fetch("/apc/upgrade/mdao/wallet?address=" + address, {
      method: "GET",
      mode: 'no-cors',
    }).then( res => {
      if(res.ok) {
        return res.json()
      }
      throw res;
    }).then( data => {
      if(data.Code == 0) {
        console.log("root", data.Data.root, data.Data.amount, data.Data.proof)
        setAvailableAmount(BigNumber.from(data.Data.amount))
        setDataJson(JSON.stringify(data.Data.proof))

        if(availableAmount.gt(BigNumber.from(0))) {
          setDisabled(false)
        }
      }
    }).catch(err => {
      //setErrMsg(err)
    })
  }, [
    address,
    disabled,
    processing,
    disabled,
    dataJson,
    availableAmount,
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
      <ul className="steps w-full">
        <Link href="">
          <a className="step step-neutral">view and confirm</a>
        </Link>

        <Link href="">
          <a className="step">claim</a>
        </Link>
      </ul>

        <CardContainer>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-4">
            <h2 className="card-title text-neutral">
            Fren labs creates this tool as a one time compensation for our loyal users who losed their $fren for using MemorySwap Batch Tool
            </h2>

              <div className="form-control w-full">
                  <label className="label text-neutral">
                      <span className="label-text text-neutral">available claim amount</span>
                      <span className="label-text-alt text-error">{availableAmount.div(bgdec).toString()}</span>
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
                  disabled= {disabled}>
                  claim
                </button>
              </div>
            </div>
          </form>
        </CardContainer>
      </div>
    </Container>
  );
}

const MiningItem: NextPage<{item: MiningRecord}> = ({ item }) => {
  const { t } = useTranslation("common");

  const { address } = useAccount();
  const [disabled, setDisabled] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [claimAmount, setClaimAmount] = useState(BigNumber.from(0))
  const [claimMaturity, setClaimMaturity] = useState(0);
  const [claimProof, setClaimProof] = useState<string[]>();

  const [claimedAmount, setClaimedAmount] = useState(BigNumber.from(0));

  const [claiming, setClaiming] = useState(false);

  const {} = useContractRead({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "claimData",
    overrides: { from: address },
    args: [address, item.Tc, item.Round],
    onSuccess(data) {
      console.log(item.Tc, item.Round, "amount：", data)
      setClaimedAmount(BigNumber.from(data));
    }
  })

  const mintName = (t : number) => {
    if(t==0) {
      return (
        <>
        <span>General</span>
        </>
      )
    } else if(t==1) {
      return (
        <>
        <span>Saving</span>
        </>
      )
    } else if(t==2) {
      return (
        <>
        <span>Multi</span>
        </>
      )
    }
  }

  const handleClaim = (item: MiningRecord, e: any) => {
    setDisabled(true)
    setProcessing(true)
    
    let bodyParam = "address=" + address + "&type=" + item.Tc + "&round=" + item.Round
    fetch("/apc/upgrade/getminingproof", {
      method: "POST",
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParam
    }).then( res => {
      if(res.ok) {
        return res.json()
      }
      setDisabled(false)
      setProcessing(false)
      throw res;
    }).then( data => {
      if(data.Code == 0) {
        setClaimAmount(BigNumber.from(data.Data.Amount).mul(bgdec))
        setClaimMaturity(item.MaturityTs)
        setClaimProof(data.Data.Proof)
      } else {
        console.log("handle claim network failed.")
        setDisabled(false)
        setProcessing(false)
      }
    }).catch(err => {
      //setErrMsg(err)
    })
  }

  const { config: _claimConfig, error: _claimerror } = usePrepareContractWrite({
    addressOrName: comAddr,
    contractInterface: comAbi,
    functionName: "claim",
    //overrides: { from: address },
    args: [item.Tc, item.Round, claimAmount, claimMaturity, claimProof],
    onSuccess(data) {
    },
  })

  const { data: _claimData, write: claimWrite } = useContractWrite({
    ..._claimConfig,
    onSuccess(data) {
      console.log("success？")
    },
    onError(e) {
      setProcessing(false)
      setDisabled(false)
    }
  });

  const {} = useWaitForTransaction({
    hash: _claimData?.hash,
    onSuccess(data) {
      toast("Success")
      setProcessing(false)
      setClaiming(false)
    },
  });

  useEffect(() => {
    if(claimedAmount.gt(BigNumber.from(0))) {
      setDisabled(true)
    }
    if(claimAmount.gt(BigNumber.from(0))) {
      if(!claiming) {
        claimWrite?.()
        setClaiming(true)
      }
    }
  }, [claimedAmount, claimAmount])

  return (
    <tr>
      <td>{item.ProxyNum}</td>
      <td>{item.Round}</td>
      <td>{item.Term}</td>
      <td>{formatDate(Number(item.MaturityTs))}</td>
      <td>{item.Rewards.toString()}</td>
      <td>{mintName(item.Tc)}</td>
      <td>
        <button
            type="button"
            className={clsx("btn btn-xs glass text-neutral ml-2", {
              loading: processing,
            })}
            onClick={handleClaim.bind(this, item)}
            disabled={timeNow <= item.MaturityTs ? true : disabled}
        >
            {t("mapping.mining.btn.claim")}
        </button>
      </td>
    </tr>
  )
}

export async function getStaticProps({ locale }: any) {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["common"])),
      },
    };
  }
  
export default DirectComp;