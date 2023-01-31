import {
  useNetwork,
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePrepareContractWrite,
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
import { MaxValueField, MaxMinterField } from "~/components/FormFields";
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

import FRENCryptoABI from "~/abi/FRENCryptoABI";
import { ethers, BigNumber } from "ethers";
import {
  batchV1Abi, batchV1Address, optNFTV1Abi, optNFTV1Address,
  batchV2Abi, batchV2Address, optNFTV2Abi, optNFTV2Address,
} from "~/abi/BatchABI";
import { batchV1Contract, batchV2Contract, fopV1Contract, fopV2Contract } from "~/lib/batch-contract";
import { FopItem } from "~/components/FopList";
import { NextPage } from "next";

let v : number = 1
const Fop: NextPage = () => {
  console.log('fop更新', new Date().getTime()/1000)
  const { t } = useTranslation("common");

  const { address } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const [disabled, setDisabled] = useState(true);
  const [maxFreeMint, setMaxFreeMint] = useState(100);
  const [processing, setProcessing] = useState(false);
  const [maturity, setMaturity] = useState<number>(UTC_TIME);

  // const {v2Balance, fopV2List} = useContext(XENContext)
  const { userMint, currentMaxTerm, globalRank, feeData, mintValue, v2Balance, fopV2List } = useContext(XENContext);
  const numberOfDays = 100;
  const quantityOfFopMint = 50;
  const addressZero = "0x0000000000000000000000000000000000000000"

  const [maxFopMint, setMaxFopMint] = useState(50);

  const schema = yup
    .object()
    .shape({
      startMintDays: yup
        .number()
        .required(t("form-field.days-required"))
        .max(
          maxFreeMint,
          t("form-field.days-maximum", { numberOfDays: maxFreeMint })
        )
        .positive(t("form-field.days-positive"))
        .typeError(t("form-field.days-required")),
      startMintQuantitys: yup
        .number()
        .required(t("batch.quantity-required"))
        .max(
          maxFopMint,
          t("batch.quantity-desc", { quantityOfFopMint: maxFopMint })
        )
        .positive(t("batch.quantity-positive"))
        .typeError(t("batch.quantity-required")),
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
  let etherMintValue:BigNumber = BigNumber.from(mintValue + '');
  if(watchAllFields.startMintQuantitys) {
    etherMintValue = BigNumber.from(watchAllFields.startMintQuantitys + '').mul(BigNumber.from(mintValue + ''));
  }
  
  const { config, error } = usePrepareContractWrite({
    addressOrName: batchV2Contract(chain).addressOrName,
    contractInterface: batchV2Abi,
    functionName: "claimRank",
    args: [addressZero, watchAllFields.startMintQuantitys ?? 0, watchAllFields.startMintDays ?? 0],
    enabled: !disabled,
    overrides: {
      value: etherMintValue,
      gasLimit: 30000000,
    }
  });

  const { data: claimRankData, write } = useContractWrite({
    ...config,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const {} = useWaitForTransaction({
    hash: claimRankData?.hash,
    onSuccess(data) {
      toast(t("toast.claim-successful"));
      router.push("/batch/fop");
    },
  });
  const onSubmit = () => {
    write?.();
  };
  const onError = (e:any) => {
    console.log('form error:', e);
  }

  /*** USE EFFECT ****/

  useEffect(() => {
    if (watchAllFields.startMintDays) {
      setMaturity(UTC_TIME + watchAllFields.startMintDays * 86400);
    }
    // 这里要替换为检查当前钱包是否有fop nft
    setDisabled(false);
    // if (!processing && address && userMint && userMint.term.isZero()) {
    //   setDisabled(false);
    // }

    setMaxFreeMint(Number(currentMaxTerm ?? 8640000) / 86400);
    setMaxFopMint(quantityOfFopMint);
  }, [
    address,
    config,
    currentMaxTerm,
    isValid,
    processing,
    userMint,
    watchAllFields,
    // watchAllFields.startMintQuantitys,
    quantityOfFopMint,
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
        <ul className="steps w-full">
          <Link href="/batch/fop">
            <a className="step step-neutral">{t("batch.fop.title")}</a>
          </Link>

          <Link href="/batch/saving">
            <a className="step">{t("batch.gas.title")}</a>
          </Link>
        </ul>

        <CardContainer>
          <form onSubmit={handleSubmit(onSubmit, onError)}>
            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">
                {t("mint.claim-rank")}
              </h2>
              <MaxValueField
                title={t("form-field.days").toUpperCase()}
                description={t("form-field.days-description")}
                decimals={0}
                value={maxFreeMint}
                disabled={disabled}
                errorMessage={
                  <ErrorMessage errors={errors} name="startMintDays" />
                }
                register={register("startMintDays")}
                setValue={setValue}
              />
              <MaxMinterField
                title={t("batch.quantity").toUpperCase()}
                description={t("batch.quantity-desc")}
                decimals={0}
                value={maxFopMint}
                disabled={disabled}
                errorMessage={
                  <ErrorMessage errors={errors} name="startMintQuantitys" />
                }
                register={register("startMintQuantitys")}
                setValue={setValue}
              />

              <div className="flex stats glass w-full text-neutral">
                <NumberStatCard
                  title={t("card.claim-rank")}
                  value={globalRank}
                  decimals={0}
                />
                <DateStatCard
                  title={t("card.maturity")}
                  dateTs={maturity}
                  isPast={false}
                />
              </div>

              <div className="alert shadow-lg glass">
                <div>
                  <div>
                    <InformationCircleIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("mint.terms")}</h3>
                    <div className="text-xs">
                      {t("mint.terms-details", { numberOfDays: maxFreeMint })}
                    </div>
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
                  {t("mint.start")}
                </button>
              </div>

              <GasEstimate
                feeData={feeData}
                gasLimit={config?.request?.gasLimit}
              />
            </div>
          </form>
        </CardContainer>

        <CardContainer>
          <h2 className="card-title">{t("batch.record")}</h2>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="hidden lg:table-cell">{t("batch.fop.tb.rank")}</th>
                  <th className="hidden lg:table-cell">{t("batch.fop.tb.term")}</th>
                  <th className="hidden lg:table-cell">{t("batch.fop.tb.estimate")}</th>
                  <th className="hidden lg:table-cell">{t("batch.fop.tb.quantity")}</th>
                  <th className="hidden lg:table-cell">{t("batch.fop.tb.exptime")}</th>
                  <th className="hidden lg:table-cell text-right">{t("batch.fop.tb.action")}</th>
                </tr>
              </thead>
              <tbody>
              {fopV2List?.map((item, index) => (
                  <FopItem tokenId={item.tokenId} owner={item.minter}  version={item.version} key={index}/>
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
  
export default Fop;