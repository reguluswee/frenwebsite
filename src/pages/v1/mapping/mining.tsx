import {
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePrepareContractWrite,
  erc20ABI,
  useContractRead,
  useSignMessage,
} from "wagmi";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "~/components/containers/Container";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

import CardContainer from "~/components/containers/CardContainer";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { clsx } from "clsx";

import { WSavingItem } from "~/components/MultiList";

import { UTC_TIME, formatDate } from "~/lib/helpers";

import toast from "react-hot-toast";
import { BigNumber } from "ethers";
import { sign } from "crypto";

const comAbi = [{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"code","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"xenContract","type":"address"},{"indexed":true,"internalType":"address","name":"tokenContract","type":"address"},{"indexed":false,"internalType":"uint256","name":"xenAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"Redeemed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"code","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfered","type":"event"},{"inputs":[],"name":"MULTI","outputs":[{"internalType":"contract BatchLogic","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"NEWFREN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PAGESIZE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PREFREN","outputs":[{"internalType":"contract PreFren","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SAVING","outputs":[{"internalType":"contract BatchLogic","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimData","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"strictTrans","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"onTokenBurned","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_check","type":"bool"}],"name":"modifyStrict","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"name":"modifyRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"drawback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_holder","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_maturityTs","type":"uint256"}],"name":"leaf","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_maturityTs","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"checkHolder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_type","type":"uint256"},{"internalType":"uint256","name":"_page","type":"uint256"}],"name":"uniQueryRounds","outputs":[{"internalType":"uint256","name":"len","type":"uint256"},{"internalType":"uint256[]","name":"rounds","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_type","type":"uint256"},{"internalType":"uint256","name":"_round","type":"uint256"}],"name":"uniQueryProxies","outputs":[{"internalType":"address[]","name":"proxies","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_maturityTs","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const comAddr = "0x016a8acb9d6342C1435536c1DfC76BD21A33Cc63";
const bgdec = BigNumber.from(10**18 + '');
const timeNow = new Date().getTime() / 1000;

export interface MiningRecord {
  owner: string,
  proxyNum: number,
  round: number,
  term: number,
  maturityTs: number,
  rewards: BigNumber,
}

const MiningSelect2 = ({ value, options, onChange } : any) => {
  return (
    <label className="label text-neutral">
      <select value={value} onChange={onChange} className="input input-bordered w-full text-neutral">
        {options.map((option:any, index: any) => (
          <option key={index} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
};

const MapMining = () => {
  const { t } = useTranslation("common");

  const approveAmount = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

  const { address } = useAccount();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [errMsg, setErrMsg] = useState("");

  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>(BigNumber.from(0));
  
  const [tipMsg, setTipMsg] = useState("");
  const [btnName, setBtnName] = useState<string>(t("mapping.staking.btn.approve"));

  const [signedMessage, setSignedMessage] = useState("");

  const [dataJson, setDataJson] = useState("[]");

  const { data, error, isLoading, signMessage } = useSignMessage({
    onSuccess(data, variables) {
      console.log(variables, data)
      setSignedMessage(data)

      let bodyParam = "wallet=" + address + "&sig=" + signedMessage + "&msg=" + variables.message + "&type=" + typeVal

      fetch("/apc/upgrade/claimowner", {
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
        throw res;
      }).then( data => {
        if(data.Code == 0) {
          toast("Success");
          setErrMsg("")
        } else {
          setErrMsg(data.Msg)
        }
      }).catch(err => {
        //setErrMsg(err)
      })
    },
  })

  const options = [
    //{ label: t("mapping.mining.form.single-mine"), value: '0' },
    { label: t("mapping.mining.form.saving-mine"), value: '1' },
    { label: t("mapping.mining.form.multitoken-mine"), value: '2' },
  ];
  const [typeVal, setTypeValue] = useState(1);
  const handleChange = (event:any) => {
    setTypeValue(event.target.value);
  };

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
        <span>MultiToken</span>
        </>
      )
    }
  }

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
    args: [comAddr, approveAmount],
  })
  const { data: approveData, write: approveWrite } = useContractWrite({
    ..._20config,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });

  const handleApprove = (e: any) => {
    approveWrite?.()
  };

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

  const onSubmit = () => {
    // approveWrite?.();
    const signMsg = 'please verify you are the owner of wallet:';
    signMessage({ message: signMsg + address })
  };

  /*** USE EFFECT ****/

  useEffect(() => {
    if (!processing) {
      setDisabled(false);
    }

    fetch("/apc/upgrade/getmining", {
      method: "POST",
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: "address=" + address + "&type=" + typeVal
    }).then( res => {
      if(res.ok) {
        return res.json()
      }
      throw res;
    }).then( data => {
      if(data.Code == 0) {
        setErrMsg("")
        setDataJson(JSON.stringify(data.Data))
      } else {
        setErrMsg(data.Msg)
      }
    }).catch(err => {
      //setErrMsg(err)
    })
  }, [
    address,
    // _20config,
    processing,
    disabled,
    typeVal,
    dataJson,
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
        <ul className="steps w-full">
          <Link href="/v1/mapping/direct">
            <a className="step">{t("mapping.direct.title")}</a>
          </Link>

          <Link href="/v1/mapping/staking">
            <a className="step">{t("mapping.staking.title")}</a>
          </Link>

          <Link href="/v1/mapping/mining">
            <a className="step step-neutral">{t("mapping.mining.title")}</a>
          </Link>
        </ul>

        <CardContainer>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">
              {t("mapping.mining.tip")}
              </h2>
              
              <div className="form-control w-full">
                  <label className="label text-neutral">
                      <span className="label-text text-neutral">{t("mapping.mining.form.mine-type")}</span>
                      <span className="label-text-alt text-error">{errMsg}</span>
                  </label>
                  <MiningSelect2 options={options} value={typeVal} onChange={handleChange}/>
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
                  {t("mapping.mining.btn.query")}
                </button>
              </div>
            </div>
          </form>
        </CardContainer>

        <CardContainer>
          <h2 className="card-title">{t("batch.record")}</h2>
          {/* <div className="text-right">
            <button type="button" className="btn btn-xs glass text-neutral ml-2" onClick={handleApprove.bind(this)}>
              {t("mapping.mining.btn.approve")}
            </button>
          </div> */}

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="lg:table-cell">{t("mapping.mining.tb.count")}</th>
                  <th className="lg:table-cell">{t("mapping.mining.tb.term")}</th>
                  <th className="lg:table-cell">{t("mapping.mining.tb.maturity")}</th>
                  <th className="lg:table-cell">{t("mapping.mining.tb.reward")}</th>
                  <th className="lg:table-cell">类型</th>
                  <th className="lg:table-cell">{t("batch.tb.action")}</th>
                </tr>
              </thead>
              <tbody>
                {JSON.parse(dataJson)?.map((item: any, index: any) => (
                    <>
                    <tr key={index}>
                      <td>{item.ProxyNum}</td>
                      <td>{item.Term}</td>
                      <td>{formatDate(Number(item.MaturityTs))}</td>
                      <td>{item.Rewards}</td>
                      <td>{mintName(item.Tc)}</td>
                      <td>
                        <button
                            type="button"
                            disabled={timeNow <= item.MaturityTs}
                            className="btn btn-xs glass text-neutral ml-2"
                        >
                            {t("mapping.mining.btn.claim")}
                        </button>
                      </td>
                    </tr>
                    </>
                ))}
              </tbody>
            </table>
          </div>
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
  
export default MapMining;