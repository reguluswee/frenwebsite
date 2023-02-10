import type { NextPage } from "next";
import { useTranslation } from "next-i18next";
import { useContractRead, useNetwork } from "wagmi";
import { multiContract } from "~/lib/batch-contract";
import React, { useState } from "react";

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

  const { data: tokenList } = useContractRead({
    ...multiContract(chain),
    functionName: "tokenList",
    args: [0],
    onSuccess(data) {
      console.log('support tokens list:', data)
    },
  });

  return (
    <div className="form-control w-full">
      <label className="label text-neutral">
        <span className="label-text text-neutral">{props.title}</span>
        <span className="label-text-alt text-error">{props.errorMessage}</span>
      </label>
      <select className="input input-bordered w-full text-neutral" onChange={(e) => props.setValue(props.register.name, e.target.value)}>
          <option value="0x0000000000000000000000000000000000000000">ETHF</option>
          <option value="0x6593900a9BEc57c5B80a12d034d683e2B89b7C99">FCZZ</option>
      </select>
      <label className="label">
        <span className="label-text-alt text-neutral">{props.description}</span>
      </label>
    </div>
  );
};