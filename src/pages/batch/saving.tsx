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
import { MaxValueField } from "~/components/FormFields";
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

const Saving = () => {
  const { t } = useTranslation("common");

  const { address } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const [disabled, setDisabled] = useState(true);
  const [maxFreeMint, setMaxFreeMint] = useState(100);
  const [processing, setProcessing] = useState(false);
  const [maturity, setMaturity] = useState<number>(UTC_TIME);

  const { userMint, currentMaxTerm, globalRank, feeData } = useContext(XENContext);
  const numberOfDays = 100;

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

  const { config, error } = usePrepareContractWrite({
    addressOrName: xenContract(chain).addressOrName,
    contractInterface: FRENCryptoABI,
    functionName: "claimRank",
    args: [watchAllFields.startMintDays ?? 0],
    enabled: !disabled,
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
      router.push("/mint/2");
    },
  });
  const onSubmit = () => {
    write?.();
  };

  /*** USE EFFECT ****/

  useEffect(() => {
    if (watchAllFields.startMintDays) {
      setMaturity(UTC_TIME + watchAllFields.startMintDays * 86400);
    }

    if (!processing && address && userMint && userMint.term.isZero()) {
      setDisabled(false);
    }

    setMaxFreeMint(Number(currentMaxTerm ?? 8640000) / 86400);
  }, [
    address,
    config,
    currentMaxTerm,
    isValid,
    processing,
    userMint,
    watchAllFields.startMintDays,
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
        <ul className="steps w-full">
          <Link href="/batch/fop">
            <a className="step">{t("batch.fop.title")}</a>
          </Link>

          <Link href="/batch/saving">
            <a className="step step-neutral">{t("batch.gas.title")}</a>
          </Link>
        </ul>

        <CardContainer>
          <form onSubmit={handleSubmit(onSubmit)}>
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
  
  export default Saving;