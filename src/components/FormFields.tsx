import type { NextPage } from "next";
import { useTranslation } from "next-i18next";
import { useContractRead, useNetwork, useBalance } from "wagmi";
import { multiContract } from "~/lib/batch-contract";
import React, { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";

export const MaxValueField: NextPage<any> = (props) => {
  const { t } = useTranslation("common");

  return (
    <div className="form-control w-full">
      <label className="label text-neutral">
        <span className="label-text text-neutral">{props.title}</span>
        <span className="label-text-alt text-error">{props.errorMessage}</span>
      </label>
      <input
        type="number"
        placeholder="1"
        className="input input-bordered w-full text-neutral"
        disabled={props.disabled}
        {...props.register}
      />
      <label className="label">
        <span className="label-text-alt text-neutral">{props.description}</span>
        <span className="label-text-alt text-neutral">
          {`${Number(props.value).toLocaleString("en-US")}`}
          <button
            type="button"
            onClick={() => props.setValue(props.register.name, props.value)}
            className="btn btn-xs glass text-neutral ml-2"
            disabled={props.disabled}
          >
            {t("form-field.max")}
          </button>
        </span>
      </label>
    </div>
  );
};

export const WalletAddressField: NextPage<any> = (props) => {
  const { t } = useTranslation("common");

  return (
    <div className="form-control w-full">
      <label className="label text-neutral">
        <span className="label-text text-neutral">{t("form-field.wallet-address")}</span>
        <span className="label-text-alt text-error">{props.errorMessage}</span>
      </label>
      <input
        type="text"
        placeholder="0x"
        className="input input-bordered w-full text-neutral"
        disabled={props.disabled}
        {...props.register}
      />
      <label className="label">
        <span className="label-text-alt text-neutral">{t("form-field.wallet-address-description")}</span>
      </label>
    </div>
  );
};

export const MaxMinterField: NextPage<any> = (props) => {
  const { t } = useTranslation("common");

  return (
    <div className="form-control w-full">
      <label className="label text-neutral">
        <span className="label-text text-neutral">{props.title}</span>
        <span className="label-text-alt text-error">{props.errorMessage}</span>
      </label>
      <input
        type="number"
        placeholder="1"
        className="input input-bordered w-full text-neutral"
        disabled={props.disabled}
        {...props.register}
      />
      <label className="label">
        <span className="label-text-alt text-neutral">{props.description}</span>
        <span className="label-text-alt text-neutral">
          {`${Number(props.value).toLocaleString("en-US")}`}
          <button
            type="button"
            onClick={() => props.setValue(props.register.name, props.value)}
            className="btn btn-xs glass text-neutral ml-2"
            disabled={props.disabled}
          >
            {t("form-field.max")}
          </button>
        </span>
      </label>
    </div>
  );
};

export const TokenSelection: NextPage<any> = (props) => {
  const { t } = useTranslation("common");

  const { chain } = useNetwork();
  const [selToken, setSelToken] = useState();
  const [estimateAmount, setEstimateAmount] = useState('');
  const { getAmount } = props;
  const [ratio, setRatio] = useState(0);

  const [credit, setCredit] = useState<BigNumber>();
  const [balance, setBalance] = useState<any>();

  const { data: tokenList } = useContractRead({
    ...multiContract(chain),
    functionName: "tokenList",
    args: [0],
    onSuccess(data) {
      console.log('support tokens list:', data)
    },
  });

  const {} = useContractRead({
    addressOrName: multiContract(chain).addressOrName,
    contractInterface: multiContract(chain).contractInterface,
    functionName: "computeClaimAmount",
    args: [selToken],
    onSuccess(data) {
      let amount = (data[0].toNumber() + data[1].toNumber())/ 10 ** (data[2].toNumber() + 8)
      amount = Math.round(amount * 10000) / 10000;
      if(amount==0)  {
        amount = 1;
      }
      props.setValue(props.register.name, {'token':selToken, 'amount': amount});
      setRatio(amount);
    }
  })

  const {} = useBalance({
    addressOrName: multiContract(chain).addressOrName,
    onSuccess(data) {
      setBalance(data.value);
    }
  })

  const {} = useContractRead({
    addressOrName: multiContract(chain).addressOrName,
    contractInterface: multiContract(chain).contractInterface,
    functionName: "tokenCredit",
    args: [selToken],
    onSuccess(data) {
      setCredit(BigNumber.from(data.toString()));
    }
  })

  const handleCompute = (minters: number | undefined) => {
    if(!minters) {
      return
    }
    let esStr = ''
    if(selToken) {
      esStr = ' - ' + ratio + '/ETHF, ' + t("form-field.coins-consume-total") + ':' + (ratio * minters);
      if(credit) {
        let minVal = credit.gte(balance) ? ethers.utils.formatEther(balance) : ethers.utils.formatEther(credit);
        esStr = esStr + ', ' + t("form-field.coins-credit-quota") + ':' + Number(minVal).toFixed(2);
      }
      setEstimateAmount(esStr);
      getAmount(ratio, ethers.utils.formatEther(balance))
    }
  }
  
  const handleChange = (e : any) => {
    setSelToken(e.target.value)
  }

  useEffect(() => {
    handleCompute(props.minters)
  }, [
    props.minters, ratio
  ])

  return (
    <div className="form-control w-full">
      <label className="label text-neutral">
        <span className="label-text text-neutral">{props.title}</span>
        <span className="label-text-alt text-error">{props.errorMessage}</span>
      </label>
      <select className="input input-bordered w-full text-neutral" onChange={(e) => handleChange(e)}>
          <option value="0x0000000000000000000000000000000000000000">ETHF</option>
          <option value="0x6593900a9BEc57c5B80a12d034d683e2B89b7C99">FCZZ</option>
      </select>
      <label className="label">
        <a href="https://www.oklink.com/zh-cn/ethf/address/0x8e3f39Beb44758C004F856E1E7498bAB26CD3F3F" rel="noopener" className="label-text-alt text-neutral">{props.description}{estimateAmount}</a>
      </label>
    </div>
  );
};