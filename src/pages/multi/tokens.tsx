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
  
  const MultiToken = () => {
    const { t } = useTranslation("common");
  
    const { address } = useAccount();
    const { chain } = useNetwork();
    const router = useRouter();
    const [disabled, setDisabled] = useState(true);
    const [maxFreeMint, setMaxFreeMint] = useState(100);
    const [processing, setProcessing] = useState(false);
    const [maturity, setMaturity] = useState<number>(UTC_TIME);
  
    const { userMint, currentMaxTerm, globalRank, feeData, multiRounds, mintValue } = useContext(XENContext);
    const numberOfDays = 100;
  
    const quantityOfMint = 80;
    const [maxMint, setMaxMint] = useState(80);
    const [tokenAllowance, setTokenAllowance] = useState<BigNumber>(BigNumber.from(0));

    const [approveProcessing, setApproveProcessing] = useState(false);
    const [ratio, setRatio] = useState<BigNumber>(BigNumber.from(0));
    const [availableBalance, setAvailableBalance] = useState<BigNumber>(BigNumber.from(0));

    const [pageSize, setPageSize] = useState(10);
    const [totalPage, setTotalPage] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [nowStart, setNowStart] = useState(0);
    const [nowEnd, setNowEnd] = useState(0);
  
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
            maxMint,
            t("batch.quantity-desc", { quantityOfMint: maxMint })
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

    const getAmount = (ratio: number, balance: number) => {
      let ndAmount = ethers.utils.parseEther(ratio + '')
      let avBalance = ethers.utils.parseEther(balance + '');
      setRatio(ndAmount);
      setAvailableBalance(avBalance);
    }
  
    /*** CONTRACT WRITE SETUP ***/
    let etherMintValue:BigNumber = BigNumber.from('0');
    if(watchAllFields.startMintQuantitys && watchAllFields.mintSelToken?.token == '0x0000000000000000000000000000000000000000') {
      etherMintValue = BigNumber.from(watchAllFields.startMintQuantitys + '').mul(BigNumber.from(mintValue + ''));
    }

    const approveAmount = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"); //ethers.utils.parseEther('100000000');
    const { config: _20config, error: _20error } = usePrepareContractWrite({
      addressOrName: watchAllFields.mintSelToken?.token,
      contractInterface: erc20ABI,
      functionName: "approve",
      args: [multiContract(chain).addressOrName, approveAmount],
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
      addressOrName: watchAllFields.mintSelToken?.token,
      contractInterface: erc20ABI,
      functionName: "allowance",
      overrides: { from: address },
      args: [address, multiContract(chain).addressOrName],
      onSuccess(data) {
        setTokenAllowance(BigNumber.from(data));
      }
    })

    const { config, error } = usePrepareContractWrite({
      addressOrName: multiContract(chain).addressOrName,
      contractInterface: multiContract(chain).contractInterface,
      functionName: "claimRank",
      args: [watchAllFields.mintSelToken?.token, watchAllFields.startMintQuantitys ?? 0, watchAllFields.startMintDays ?? 0],
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
      // hash: claimRankData?.hash,
      hash: approveProcessing ? approveData?.hash : claimRankData?.hash,
      onSuccess(data) {
        if(approveProcessing) {
          toast(t("toast.approve-successful"));
          write?.();
        } else {
          router.push("/multi/tokens");
        }
      },
      onError(err) {
        console.log('tx ended error', err)
        setDisabled(false)
        setProcessing(false)
        setApproveProcessing(false)
      },
      onSettled(de) {
        console.log('tx ended settled', de)
        setDisabled(false)
        setProcessing(false)
        setApproveProcessing(false)
      }
    });
    const onSubmit = () => {
      if(watchAllFields.mintSelToken) {
        if( watchAllFields.mintSelToken.token == '0x0000000000000000000000000000000000000000') {
          write?.();
        } else {
          let bigMinters = BigNumber.from(watchAllFields.startMintQuantitys + '');
          let totalNeedEthf = bigMinters.mul(BigNumber.from(10 ** 18 + ''));
          console.log('relative amounts:', tokenAllowance?.toString(), ratio.toString(), totalNeedEthf.toString());
          if(totalNeedEthf.gt(availableBalance)) {
            alert(t('limit-exceed'));
            return
          }
          if(tokenAllowance.lte(bigMinters.mul(ratio))) {
            approveWrite?.();
          } else {
            write?.();
          }
        }
      }
    };
  
    /*** USE EFFECT ****/
  
    useEffect(() => {
      if (watchAllFields.startMintDays) {
        setMaturity(UTC_TIME + watchAllFields.startMintDays * 86400);
      }
  
      // setDisabled(false);
      if (!processing && !approveProcessing) {
        setDisabled(false);
      }
  
      setMaxFreeMint(Number(currentMaxTerm ?? 8640000) / 86400);
      setMaxMint(quantityOfMint);

      if(multiRounds.length <= pageSize) {
        setTotalPage(1)
      } else {
        setTotalPage(multiRounds.length % pageSize == 0 ? multiRounds.length / pageSize : ( Math.floor(multiRounds.length / pageSize) + 1));
      }

      let start = (currentPage - 1) * pageSize;
      // let end = (start + 1) * pageSize;
      let end = start + pageSize;
      if(end > multiRounds.length) {
        end = multiRounds.length;
      }

      setNowStart(start)
      setNowEnd(end)
    }, [
      address,
      config,
      currentMaxTerm,
      isValid,
      processing,
      approveProcessing,
      userMint,
      watchAllFields,

      currentPage,
      multiRounds
    ]);
  
    return (
      <Container className="max-w-2xl">
        <div className="flew flex-row space-y-8 ">
          <ul className="steps w-full">
            <Link href="/batch/fop">
              <a className="step">{t("batch.fop.title")}</a>
            </Link>
  
            <Link href="/batch/saving">
              <a className="step">{t("batch.gas.title")}</a>
            </Link>

            <Link href="/multi/tokens">
              <a className="step step-neutral">{t("batch.multi.title")}</a>
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
                <MaxMinterField
                  title={t("batch.quantity").toUpperCase()}
                  description={t("batch.quantity-desc")}
                  decimals={0}
                  value={maxMint}
                  disabled={disabled}
                  errorMessage={
                    <ErrorMessage errors={errors} name="startMintQuantitys" />
                  }
                  register={register("startMintQuantitys")}
                  setValue={setValue}
                />

                <TokenSelection
                  title={t("form-field.coins").toUpperCase()}
                  description={t("form-field.coins-description")}
                  decimals={0}
                  minters={watchAllFields.startMintQuantitys}
                  value={maxFreeMint}
                  disabled={disabled}
                  errorMessage={
                    <ErrorMessage errors={errors} name="mintSelToken" />
                  }
                  register={register("mintSelToken")}
                  setValue={setValue}
                  getAmount={getAmount}
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
            <div className="text-right">
              <button
                  type="button"
                  onClick={setCurrentPage.bind(this, currentPage <= 1 ? 1 : (currentPage-1))}
                  className="btn btn-xs glass text-neutral ml-2"
              >
                  pre
              </button>
              <span className="btn btn-xs glass text-neutral ml-2">{currentPage} / {totalPage}</span>
              <button
                  type="button"
                  onClick={setCurrentPage.bind(this, currentPage >= totalPage ? totalPage : (currentPage+1))}
                  className="btn btn-xs glass text-neutral ml-2"
              >
                  next
              </button>
            </div>
  
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="hidden lg:table-cell">{t("batch.tb.rank")}</th>
                    <th className="hidden lg:table-cell">{t("batch.tb.term")}</th>
                    <th className="hidden lg:table-cell">{t("batch.tb.estimate")}</th>
                    <th className="hidden lg:table-cell">{t("batch.tb.quantity")}</th>
                    <th className="hidden lg:table-cell">{t("batch.tb.exptime")}</th>
                    <th className="hidden lg:table-cell text-right">{t("batch.tb.action")}</th>
                  </tr>
                </thead>
                <tbody>
                {multiRounds.slice(nowStart, nowEnd)?.map((item, index) => (
                    <WSavingItem round={item} key={index}/>
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
    
export default MultiToken;