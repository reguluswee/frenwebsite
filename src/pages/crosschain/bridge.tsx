import {
  useNetwork,
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePrepareContractWrite,
  useContractRead,
  erc20ABI,
  useSwitchNetwork,
} from "wagmi";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "~/components/containers/Container";
import { useRouter } from "next/router";
import { useEffect, useState, useContext } from "react";
import { useTranslation } from "next-i18next";
import XENContext from "~/contexts/XENContext";
import { UTC_TIME } from "~/lib/helpers";

import CardContainer from "~/components/containers/CardContainer";
import Link from "next/link";
import { MaxValueField, MaxMinterField } from "~/components/FormFields";
import { InformationCircleIcon } from "@heroicons/react/outline";
import { DateStatCard, NumberStatCard } from "~/components/StatCards";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { yupResolver } from "@hookform/resolvers/yup";
import { clsx } from "clsx";
import * as yup from "yup";
import toast from "react-hot-toast";
import GasEstimate from "~/components/GasEstimate";

import { BigNumber, ethers } from "ethers";

import { lockFancyProxyContract } from "~/lib/batch-contract";

export interface CrossObj {
  ChainId: number,
  Amount: BigNumber,
  RollUpHash: string,
  CrossStatus: number,
  Id: number,
}

const crossTokenABI = [{"inputs":[{"internalType":"address","name":"_minter","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"round","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"CrossIn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DAYS_IN_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FIXED_INFLATE_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GENESIS_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDS_IN_DAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDS_IN_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burnFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"crossMinter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"genesisTs","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"roundClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"roundDistribution","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"crossIn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"},{"internalType":"bytes32","name":"_origin","type":"bytes32"},{"internalType":"uint256","name":"_chainId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"currentQuota","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_cmts","type":"uint256"}],"name":"computeQuota","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"},{"internalType":"bytes32","name":"_origin","type":"bytes32"},{"internalType":"uint256","name":"_chainId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"}],"name":"checkHolder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_holder","type":"address"},{"internalType":"bytes32","name":"_origin","type":"bytes32"},{"internalType":"uint256","name":"_chainId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"leaf","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"}]
const crossTokenAddr = '0xE6A768464B042a6d029394dB1fdeF360Cb60bbEb'

const Bridge = () => {
  const { t } = useTranslation("common");

  const { address } = useAccount();
  const [crossAccount, setCrossAccount] = useState("")

  const { chain } = useNetwork();
  const router = useRouter();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [allowanceAmount, setAllowanceAmount] = useState(BigNumber.from(0))
  const [aping, setAping] = useState(false)
  const [tbdAmount, setTbdAmount] = useState(BigNumber.from(0))

  const [crossRecords, setCrossRecords] = useState("[]")

  const { xenBalance, feeData } = useContext(XENContext);

  const schema = yup
    .object()
    .shape({
      crossAmount: yup
        .number()
        .required(t("form-field.crosschain-amount-required"))
        .positive(t("form-field.crosschain-amount-positive"))
        .typeError(t("form-field.crosschain-amount-required")),
    })
    .required();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
  });
  const watchAllFields = watch();

  /*** CONTRACT WRITE SETUP ***/

  /*** CONTRACT WRITE SETUP ***/
  const { config: _20config, error: _20error } = usePrepareContractWrite({
    addressOrName: '0xf81ed9cecFE069984690A30b64c9AAf5c0245C9F',
    contractInterface: erc20ABI,
    functionName: "approve",
    args: [lockFancyProxyContract(chain).addressOrName, watchAllFields.crossAmount ? ethers.utils.parseEther(watchAllFields.crossAmount).toHexString() : 0],
  })
  const { data: approveData, write: approveWrite } = useContractWrite({
    ..._20config,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
      setAllowanceAmount(ethers.utils.parseEther(watchAllFields.crossAmount))
    },
  });

  const {} = useContractRead({
    addressOrName: "0xf81ed9cecFE069984690A30b64c9AAf5c0245C9F",
    contractInterface: erc20ABI,
    functionName: "allowance",
    args: [address, lockFancyProxyContract(chain).addressOrName],
    onSuccess(data) {
      setAllowanceAmount(BigNumber.from(data))
    }
  })

  //明天要处理这两个方法
  const {} = useContractRead({
    addressOrName: lockFancyProxyContract(chain).addressOrName,
    contractInterface: lockFancyProxyContract(chain).contractInterface,
    functionName: "tbdMapping",
    args: [56, address],
    onSuccess(data) {
      setTbdAmount(BigNumber.from(data))
    }
  })
  
  const {} = useContractRead({
    addressOrName: lockFancyProxyContract(chain).addressOrName,
    contractInterface: lockFancyProxyContract(chain).contractInterface,
    functionName: "roundMapping",
    args: [56, 0],
    onSuccess(data) {
      console.log("cross records：", data)
    }
  })

  const { config, error } = usePrepareContractWrite({
    addressOrName: lockFancyProxyContract(chain).addressOrName,
    contractInterface: lockFancyProxyContract(chain).contractInterface,
    functionName: "lockToChain",
    args: [56, watchAllFields.crossAmount ? ethers.utils.parseEther(watchAllFields.crossAmount).toHexString() : 0],
    enabled: !disabled,
  });
  const { data: claimLock, write } = useContractWrite({
    ...config,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const {} = useWaitForTransaction({
    hash: aping ? approveData?.hash : claimLock?.hash,
    onSuccess(data) {
      if(aping) {
        setAping(false);
        handleStakeSubmit();
      } else {
        toast(t("toast.claim-successful"));
        router.push("/crosschain/bridge");
      }
    },
  });
  const handleStakeSubmit = () => {
    // write?.();
    let crossAmount = ethers.utils.parseEther(watchAllFields.crossAmount)
    if(allowanceAmount.gte(crossAmount)) {
      write?.();
    } else {
      setAping(true)
      approveWrite?.()
    }
  };

  const handleCrossAccount = (newWallet: string) => {
    setCrossAccount(newWallet)
  }

  /*** USE EFFECT ****/

  useEffect(() => {
    setDisabled(false);

    let paramAddress = (crossAccount!='' ? crossAccount : address)
    if(paramAddress!='') {
      let bodyParam = "wallet=" + paramAddress
      fetch("/apc/cross/record", {
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
          setCrossRecords(JSON.stringify(data.Data))
        } else {
          console.log("handle claim network failed.")
        }
      }).catch(err => {
        //setErrMsg(err)
      })
    }
  }, [
    address,
    config,
    isValid,
    processing,
    watchAllFields,
    aping,
    allowanceAmount,
    crossAccount,
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
        <ul className="steps w-full">
          <Link href="/batch/saving">
            <a className="step step-neutral">{t("crosschain.step1")}</a>
          </Link>

          <Link href="/multi/tokens">
            <a className="step">{t("crosschain.step2")}</a>
          </Link>
        </ul>

        <CardContainer>
        <form onSubmit={handleSubmit(handleStakeSubmit)}>
            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">{t("crosschain.start")}</h2>
              <MaxValueField
                title={t("form-field.amount").toUpperCase()}
                description={t("form-field.amount-description")}
                value={ethers.utils.formatUnits(
                  xenBalance?.value ?? BigNumber.from(0),
                  xenBalance?.decimals ?? BigNumber.from(0)
                )}
                disabled={disabled}
                errorMessage={<ErrorMessage errors={errors} name="crossAmount" />}
                register={register("crossAmount")}
                setValue={setValue}
              />

              <div className="alert shadow-lg glass">
                <div>
                  <div>
                    <InformationCircleIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("crosschain.des")}</h3>
                    <div className="text-xs">{t("crosschain.des-details")}</div>
                  </div>
                </div>
              </div>
              <div className="form-control w-full">
                <button
                  type="submit"
                  className={clsx("btn glass text-neutral", {
                    loading: processing,
                  })}
                  disabled={disabled}
                >
                  {t("crosschain.start")}
                </button>
              </div>
              <GasEstimate feeData={feeData} gasLimit={config?.request?.gasLimit} />
            </div>
          </form>
        </CardContainer>

        <CardContainer>
          <h2 className="card-title">{t("crosschain.record")}</h2>
          <div className="text-right">{crossAccount}</div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="hidden lg:table-cell">{t("crosschain.record-item.amount")}</th>
                  <th className="hidden lg:table-cell">{t("crosschain.record-item.status")}</th>
                  <th className="hidden lg:table-cell text-right">{t("crosschain.record-item.action")}</th>
                </tr>
                {JSON.parse(crossRecords)?.map((item: CrossObj, index: any) => (
                    <BridgeItem item={item} tbAmount={tbdAmount} crossAccount={crossAccount} key={index} handler={handleCrossAccount}/>
                ))}
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        </CardContainer>
        
      </div>
    </Container>
  );
}

const BridgeItem: NextPage<{item: CrossObj, tbAmount: BigNumber, crossAccount: string, handler: any}> = ({ item, tbAmount, crossAccount, handler }) => {
  const { t } = useTranslation("common");

  const { address } = useAccount();
  const [disabled, setDisabled] = useState(false);
  const {chain} = useNetwork();

  var provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);

  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork({
    chainId: 56,
    onSuccess(data) {
      if(window.ethereum) {
        provider.send('eth_requestAccounts', []).then((value) => {
          console.log('>>> accounts: ', value);  // 打印你的当前连接上的地址
          handler(value[0])
        });
      }
    }
  });

  const [processing, setProcessing] = useState(false);

  const [claimAmount, setClaimAmount] = useState(BigNumber.from(0))
  const [claimMaturity, setClaimMaturity] = useState(0);
  const [claimProof, setClaimProof] = useState<string[]>();

  const [claimedAmount, setClaimedAmount] = useState(BigNumber.from(0));

  const [claiming, setClaiming] = useState(false);

  const handleClaim = (item: CrossObj, e: any) => {
    if(!crossAccount && chain?.id!=56) {
      switchNetwork?.()
      return
    }
    
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    setDisabled(true)
    setProcessing(true)

    let paramAddress = (crossAccount!='' ? crossAccount : address)
    let bodyParam = "wallet=" + paramAddress + "&round=" + item.RollUpHash + "&amount=" + item.Amount + "&id=" + item.Id
    fetch("/apc/cross/proof", {
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
        setClaimProof(data.Data.Proof)
        
        contractClaim(data.Data.root, data.Data.origin, data.Data.chainId, data.Data.amount, data.Data.proof)
      } else {
        console.log("handle claim network failed.")
        setDisabled(false)
        setProcessing(false)
      }
    }).catch(err => {
      //setErrMsg(err)
    })
  }

  const contractClaim = async (merkRoot: string, origin: string, chainId:number, amount:BigNumber, proof: string[]) => {
    const signer = provider.getSigner()

    console.log("params", merkRoot, origin, chainId, amount, proof)

    const crossTokenContract = new ethers.Contract(crossTokenAddr, crossTokenABI, signer)

    let tx = await crossTokenContract.claim(merkRoot, origin, chainId, amount, proof)
    let receipt = await tx.wait();
    console.log(receipt);
  }

  const { config: unlockConfig, error: unlockError } = usePrepareContractWrite({
    addressOrName: lockFancyProxyContract(chain).addressOrName,
    contractInterface: lockFancyProxyContract(chain).contractInterface,
    functionName: "unLockToChainIf",
    args: [56, tbAmount ? ethers.utils.parseEther(tbAmount.toString()).toHexString() : 0],
    enabled: !disabled,
  });
  const { data: unlockData, write: unLockWrite } = useContractWrite({
    ...unlockConfig,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });

  useEffect(() => {
  }, [])

  return (
    <tr>
      <td>{BigNumber.from(item.Amount).div(BigNumber.from("100000000000000000")).toString()}</td>
      <td>
        {item.CrossStatus==0 && t("crosschain.status-text.waiting")}
        {item.CrossStatus==1 && t("crosschain.status-text.packed")}
        {item.CrossStatus==2 && t("crosschain.status-text.finished")}
      </td>
      <td className="hidden lg:table-cell text-right">
        {
          <button
            type="button"
            onClick={handleClaim.bind(this, item)}
            className="btn btn-xs glass text-neutral ml-2"
            disabled={item.CrossStatus!=2}
          >
            {t("crosschain.claim")}
          </button>
        }
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
  
  export default Bridge;