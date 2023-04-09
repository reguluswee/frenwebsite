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
  
  import toast from "react-hot-toast";
  import { BigNumber } from "ethers";

  const comAbi = [{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"code","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"xenContract","type":"address"},{"indexed":true,"internalType":"address","name":"tokenContract","type":"address"},{"indexed":false,"internalType":"uint256","name":"xenAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"Redeemed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"code","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfered","type":"event"},{"inputs":[],"name":"NEWFREN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"PREFREN","outputs":[{"internalType":"contract PreFren","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"strictTrans","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"transferAddress","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_check","type":"bool"}],"name":"modifyStrict","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"name":"modifyRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"drawback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"checkHolder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"onTokenBurned","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_holder","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"leaf","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"transfer","outputs":[],"stateMutability":"nonpayable","type":"function"}];
  const comAddr = "0x827f2f104E2f364C5423054921732aa54B51F37B";
  const bgdec = BigNumber.from(10**18 + '');
  
  const Compensate = () => {
    const { t } = useTranslation("common");
  
    const { address } = useAccount();
    const [disabled, setDisabled] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [errMsg, setErrMsg] = useState("");

    const [availableAmountStr, setAvailableAmountStr] = useState("0");
    const [availableAmount, setAvailableAmount] = useState(0);
    const [proof, setProof] = useState<string>("")

    const [approveProcessing, setApproveProcessing] = useState(false);
    const [tokenAllowance, setTokenAllowance] = useState<BigNumber>(BigNumber.from(0));
    const [claimStatus, setClaimStatus] = useState(0);
    const [tipMsg, setTipMsg] = useState("");

    const {
        handleSubmit,
      } = useForm({
        mode: "onChange",
      });
    const {} = fetch("/apc/upgrade/getamount", {
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
        if(claimStatus!=2) {
          setAvailableAmount(BigNumber.from(data.Data.Amount).div(bgdec).toNumber())
          setAvailableAmountStr(data.Data.Amount)
          setProof(JSON.stringify(data.Data.Proof))
        }
      }
    }).catch(err => {
      setErrMsg(err)
    })
  
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
        setApproveProcessing(true);
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
      functionName: "transferAddress",
      overrides: { from: address },
      args: [address],
      onSuccess(data) {
        let status = Number(data)
        setClaimStatus(status)
        if(status==2) {
          setTipMsg(t("mapping.general.transfered"))
          setAvailableAmount(0)
          setAvailableAmountStr("0")
          setDisabled(true)
        } else if(status==1) {
          setTipMsg(t("mapping.general.claimed"))
        }
      }
    })

    const {} = useContractRead({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "checkHolder",
      overrides: { from: address },
      args: [availableAmountStr, JSON.parse(proof==""?"[]":proof)],
      onSuccess(data) {
        if(!data) {
          setTipMsg(t("mapping.general.noavailable"))
          setAvailableAmount(0)
          setAvailableAmountStr("0")
          setDisabled(true)
        } else {
          setDisabled(false)
        }
      }
    })

    const { config: _claimConfig, error: _claimerror } = usePrepareContractWrite({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "claim",
      args: [availableAmountStr, JSON.parse(proof==""?"[]":proof)],
      onSuccess(data) {
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
      // hash: cliamata?.hash,
      hash: approveProcessing ? approveData?.hash : (claimStatus==0 ? _claimData?.hash : (claimStatus==1 ? _tranData?.hash : "")),
      onSuccess(data) {
        //toast(t("toast.approve-successful"));
        if(approveProcessing) {
          setApproveProcessing(false)
          writeClaim?.()
        } else {
          //claim over
          toast(t("toast.approve-successful"));
          setProcessing(false)
          setDisabled(false)
        }
      },

    });
    const onSubmit = () => {
      if(claimStatus==0) {
        if(BigNumber.from(availableAmountStr).gt(tokenAllowance)) {
          approveWrite?.();
        } else {
          writeClaim?.();
        }
      } else if(claimStatus==1) {
        writeTransfer?.()
      } else {
        toast(t("mapping.general.transfered"));
      }
    };
  
    /*** USE EFFECT ****/
  
    useEffect(() => {
      if (!processing) {
        setDisabled(false);
      }
    }, [
      address,
      _20config,
      processing,
      availableAmount,
      availableAmountStr,
      proof,
      claimStatus,
      _claimConfig,
      _tranConfig
    ]);
  
    return (
      <Container className="max-w-2xl">
        <div className="flew flex-row space-y-8 ">
          <ul className="steps w-full">
            <Link href="/mapping/direct">
              <a className="step step-neutral">{t("mapping.direct.title")}</a>
            </Link>
  
            <Link href="/mapping/staking">
              <a className="step">{t("mapping.staking.title")}</a>
            </Link>

            <Link href="/mapping/mining">
              <a className="step">{t("mapping.mining.title")}</a>
            </Link>
          </ul>
  
          <CardContainer>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">
                {t("mapping.direct.tip")}
                </h2>
                <div className="form-control w-full">
                    <label className="label text-neutral">
                        <span className="label-text text-neutral">{t("mapping.general.amount")}</span>
                        <span className="label-text-alt text-error">{errMsg}</span>
                    </label>
                    <label className="label">
                        <span className="input input-bordered w-full text-neutral">{claimStatus==2 ? 0 : availableAmount}</span>
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
                    disabled={claimStatus==2 || availableAmount==0 ? true : disabled}
                  >
                    {claimStatus == 0 ? t("mapping.direct.btn.confirm") : (claimStatus==1 ? t("mapping.direct.btn.claim") : "claimed")}
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