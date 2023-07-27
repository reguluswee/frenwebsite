import Link from "next/link";
import Container from "~/components/containers/Container";
import { useNetwork, useAccount, useContractWrite, useWaitForTransaction, usePrepareContractWrite, erc20ABI } from "wagmi";
import { MaxValueField } from "~/components/FormFields";
import { InformationCircleIcon } from "@heroicons/react/outline";
import { useEffect, useState, useContext } from "react";
import { DateStatCard, NumberStatCard } from "~/components/StatCards";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { xenContract } from "~/lib/xen-contract";
import { UTC_TIME, stakeYield } from "~/lib/helpers";
import { BigNumber, Wallet, ethers } from "ethers";
import { ErrorMessage } from "@hookform/error-message";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import GasEstimate from "~/components/GasEstimate";
import { clsx } from "clsx";
import * as yup from "yup";
import CardContainer from "~/components/containers/CardContainer";
import XENContext from "~/contexts/XENContext";
import XENCryptoABI from "~/abi/XENCryptoABI";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Breadcrumbs from "~/components/Breadcrumbs";

const batchToolAddr = "0xDf4191d2B62AF0355b5EcD89a0487367663167aE"
const batchToolAbi = [{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address[]","name":"addressList","type":"address[]"}],"name":"batchTrans","outputs":[],"stateMutability":"payable","type":"function","payable":true},{"inputs":[{"internalType":"address","name":"tokenAddr","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address[]","name":"addressList","type":"address[]"}],"name":"batchTransToken","outputs":[],"stateMutability":"nonpayable","type":"function"}]

const TkTrans = () => {
  const { t } = useTranslation("common");

  const { address } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [tokenContract, setTokenContract] = useState('');
  const [singleAmount, setSingleAmount] = useState(0);
  const [addresses, setAddresses] = useState('');
  const [addressLength, setAddressLength] = useState(0)
  const [efftAddrs, setEfftAddrs] = useState<string[]>([]);

  const { xenBalance, userStake, genesisTs, currentAPY, feeData } = useContext(XENContext);



  /*** FORM SETUP ***/

  const schema = yup
    .object()
    .shape({
      // startStakeAmount: yup
      //   .number()
      //   .required(t("form-field.amount-required"))
      //   .max(
      //     Number(ethers.utils.formatUnits(xenBalance?.value ?? BigNumber.from(0))),
      //     t("form-field.amount-maximum", {
      //       maximumAmount: xenBalance?.formatted,
      //     })
      //   )
      //   .positive(t("form-field.amount-positive"))
      //   .typeError(t("form-field.amount-required")),
      // startStakeDays: yup
      //   .number()
      //   .required(t("form-field.days-required"))
      //   .max(1000, t("form-field.days-maximum", { numberOfDays: 1000 }))
      //   .positive(t("form-field.days-positive"))
      //   .typeError(t("form-field.days-required")),
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

  const handleChange = (e : any) => {
    console.log(e.target.value)
    let WalletList = e.target.value.split(/[(\r\n)\r\n]+/);
    let available = 0

    let newEfftAddrs : string[] = []
    for(var i=0; i<WalletList.length; i++) {
      if(ethers.utils.isAddress(WalletList[i])) {
        available ++;
        newEfftAddrs.push(WalletList[i]);
      }
    }
    setAddressLength(available)
    setEfftAddrs(newEfftAddrs)
  }
  const watchAllFields = watch();

  const handleInputTokenContract = (e : any) => {
    setTokenContract(e.target.value)
  }
  /*** CONTRACT WRITE SETUP ***/

  // original coin batch transfer
  const { config:coinConfig } = usePrepareContractWrite({
    addressOrName: batchToolAddr,
    contractInterface: batchToolAbi,
    functionName: "batchTrans",
    args: [
      ethers.utils.parseUnits((Number(singleAmount) || 0).toString(), xenBalance?.decimals ?? 0),
      efftAddrs
    ],
    overrides: {
      value: ethers.utils.parseUnits((Number(singleAmount * addressLength) || 0).toString(), xenBalance?.decimals ?? 0)
    },
    enabled: !disabled,
    onError(e){
      console.log("cuowu", e)
    }
  });
  const { data: coinData, write: writeCoin } = useContractWrite({
    ...coinConfig,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
    onError(e) {
      console.log("dddd", e)
    }
  });

  // token batch transfer
  const { config:tokenConfig } = usePrepareContractWrite({
    addressOrName: batchToolAddr,
    contractInterface: batchToolAbi,
    functionName: "batchTransToken",
    args: [
      tokenContract,
      ethers.utils.parseUnits((Number(singleAmount) || 0).toString(), xenBalance?.decimals ?? 0),
      efftAddrs
    ],
    enabled: !disabled,
    onError(e){
      console.log("cuowu", e)
    }
  });
  const { data: tokenData, write: writeToken } = useContractWrite({
    ...tokenConfig,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
    onError(e) {
      console.log("dddd", e)
    }
  });




  const {} = useWaitForTransaction({
    hash: tokenContract=='' ? coinData?.hash : tokenData?.hash,
    onSuccess(data) {
      toast(t("toast.stake-successful"));
    },
  });
  const handleStakeSubmit = async (data: any) => {
    if(tokenContract=='') {
      writeCoin?.();
    } else {

      let allow = await readAllowance()
      console.log("授权的金额", allow)
      let needAmount = ethers.utils.parseUnits((Number(singleAmount) || 0).toString(), xenBalance?.decimals ?? 0)
      needAmount = needAmount.mul(BigNumber.from(addressLength))

      if(BigNumber.from(allow).gte(needAmount)) {
        writeToken?.();
      } else {
        let status = await asyncApprove();
        console.log("返回的授权结果", status)
        if(status==1) {
          console.log("这里应该可以了吧")
          writeToken?.();
        }
      }
    }
  };

  const asyncApprove = async() => {
      var provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const signer = provider.getSigner()
      const crossTokenContract = new ethers.Contract(tokenContract, erc20ABI, signer)

      let needAmount = ethers.utils.parseUnits((Number(singleAmount) || 0).toString(), xenBalance?.decimals ?? 0)
      needAmount = needAmount.mul(BigNumber.from(addressLength))

      const tx = await crossTokenContract.approve(batchToolAddr, needAmount)
      const receipt = await tx.wait()
      return receipt.status;
  }
  const readAllowance = async () => {
    var provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider)
    const contract = new ethers.Contract(tokenContract, erc20ABI, provider);
    const allow = await contract.allowance(address, batchToolAddr)
    return allow;
  }

  /*** USE EFFECT ****/

  useEffect(() => {

    if (!processing && address && userStake && userStake.term.toNumber() == 0) {
      setDisabled(false);
    }
  }, [address, processing, userStake, watchAllFields.startStakeDays, isValid, coinConfig]);

  return (
    <Container className="max-w-2xl">
      <Breadcrumbs />

      <div className="flew flex-row space-y-8 ">
        <CardContainer>
          <form onSubmit={handleSubmit(handleStakeSubmit)}>
            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">{"Tool - Batch Transfer"}</h2>
              <div className="form-control w-full">
                <label className="label text-neutral">
                  <span className="label-text text-neutral">{"Coin or Token"}</span>
                  <span className="label-text-alt text-error">{"leave empty if coin"}</span>
                </label>
                <input
                  type="text"
                  placeholder="0x"
                  className="input input-bordered w-full text-neutral"
                  value={tokenContract}
                  onChange={e => handleInputTokenContract(e)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label text-neutral">
                  <span className="label-text text-neutral">{"Amount"}</span>
                  <span className="label-text-alt text-error">{""}</span>
                </label>
                <input
                  type="text"
                  placeholder="transfer amount"
                  className="input input-bordered w-full text-neutral"
                  value={singleAmount}
                  onChange={e => setSingleAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-control w-full">
                <label className="label text-neutral">
                  <span className="label-text text-neutral">{"Addresses"}</span>
                  <span className="label-text-alt text-error">{addressLength}</span>
                </label>
                <textarea
                  placeholder="One address per line" onChange={(e) => handleChange(e)}
                  className="input input-bordered w-full text-neutral" style={{height:"200px"}}>
                    {addresses}
                </textarea>
              </div>
              
              
              <div className="form-control w-full">
                <button
                  type="submit"
                  className={clsx("btn glass text-neutral", {
                    loading: processing,
                  })}
                  disabled={disabled}
                >
                  {"Send"}
                </button>
              </div>
              <GasEstimate feeData={feeData} gasLimit={coinConfig?.request?.gasLimit} />
            </div>
          </form>
        </CardContainer>
      </div>
    </Container>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default TkTrans;