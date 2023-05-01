import {
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePrepareContractWrite,
  erc20ABI,
  useContractRead,
  useSignMessage,

  usePrepareSendTransaction,
  useSendTransaction
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

import { formatDate, estimatedXEN } from "~/lib/helpers";

import toast from "react-hot-toast";
import { BigNumber } from "ethers";

const comAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"ACCEPT_WALLET","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"FOPV1NFT","outputs":[{"internalType":"contract FOPV1","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"FOPV2NFT","outputs":[{"internalType":"contract FOPV2","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"FRENTOKEN","outputs":[{"internalType":"contract NewFren","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"SNAPSHOT_GLOBALRANK","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"drawback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_version","type":"uint256"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"calculateAvailable","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"claimV1","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"claimV2","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const comAddr = "0x42fa4E772f4f9a36F19B34dAD7DA7Fb4CB768e64";

const optNFTAbi = [{"inputs":[{"internalType":"address","name":"_initialMinter","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"MintZeroQuantity","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"burnCount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"mintIndex","type":"uint256"}],"name":"MintEvp","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldMinter","type":"address"},{"indexed":true,"internalType":"address","name":"newMinter","type":"address"}],"name":"MinterTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"MintershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"OpBurn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"index","type":"uint256"}],"name":"OpMint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"wrapperUri","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getBaseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"totalBurned","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOfWithPack","outputs":[{"internalType":"bool","name":"","type":"bool"},{"components":[{"internalType":"address","name":"minter","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"eaaRate","type":"uint256"},{"internalType":"uint256","name":"amp","type":"uint256"},{"internalType":"uint256","name":"cRank","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"address[]","name":"pMinters","type":"address[]"}],"internalType":"struct IBurnableFOP.BullPack","name":"","type":"tuple"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"newMinter","type":"address"}],"name":"transferMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"minter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"giveAddress","type":"address"},{"internalType":"uint256","name":"eaaRate","type":"uint256"},{"internalType":"uint256","name":"amp","type":"uint256"},{"internalType":"uint256","name":"cRank","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"address[]","name":"pMinters","type":"address[]"}],"name":"mintOption","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burnOption","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const optNFTAddress = '0xa5E5e2506392B8467A4f75b6308a79c181Ab9fbF'
const optNFTV2Abi = [{"inputs":[{"internalType":"address","name":"_initialMinter","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"MintZeroQuantity","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"burnCount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"mintIndex","type":"uint256"}],"name":"MintEvp","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldMinter","type":"address"},{"indexed":true,"internalType":"address","name":"newMinter","type":"address"}],"name":"MinterTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"MintershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"OpBurn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"index","type":"uint256"}],"name":"OpMint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"wrapperUri","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getBaseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"totalBurned","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOfWithPack","outputs":[{"internalType":"bool","name":"","type":"bool"},{"components":[{"internalType":"address","name":"minter","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"eaaRate","type":"uint256"},{"internalType":"uint256","name":"amp","type":"uint256"},{"internalType":"uint256","name":"cRank","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"canTransfer","type":"uint256"},{"internalType":"address[]","name":"pMinters","type":"address[]"}],"internalType":"struct IBurnableFOPV2.BullPack","name":"","type":"tuple"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"newMinter","type":"address"}],"name":"transferMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"minter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"giveAddress","type":"address"},{"internalType":"uint256","name":"eaaRate","type":"uint256"},{"internalType":"uint256","name":"amp","type":"uint256"},{"internalType":"uint256","name":"cRank","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"canTransfer","type":"uint256"},{"internalType":"address[]","name":"pMinters","type":"address[]"}],"name":"mintOption","outputs":[{"internalType":"uint256","name":"_newTokenId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burnOption","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const optNFTV2Address = '0x3A02488875719258475d44601685172C213510b4'

const bgdec = BigNumber.from(10**18 + '');
const timeNow = new Date().getTime() / 1000;

const globalRank = 1180918

export interface FopObj {
  Amp: number,
  Block: number,
  Contract: string,
  Crank: number,
  Eaa: number,
  Len: number,
  Term: number,
  TokenId: number,
  Txhash: string,
  Wallet: string,
  MaturityTs: number,
}

const MapFop = () => {
  const { t } = useTranslation("common");

  const approveAmount = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

  const { address } = useAccount();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [errMsg, setErrMsg] = useState("");

  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>(BigNumber.from(0));
  
  const [tipMsg, setTipMsg] = useState("");

  const [signedMessage, setSignedMessage] = useState("");

  const [dataJson, setDataJson] = useState("[]");

  const [remainBalance, setRemainBalance] = useState(BigNumber.from(0));

  useEffect(() => {
  }, []);

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
            <a className="step">{t("mapping.mining.title")}</a>
          </Link>

          <Link href="/v1/mapping/fop">
            <a className="step step-neutral">{t("mapping.fop.title")}</a>
          </Link>
        </ul>

        <FopRecord version={1}/>
        <FopRecord version={2}/>
      </div>
    </Container>
  );
}

const FopRecord: NextPage<{version: number}> = ({ version }) => {

  const { t } = useTranslation("common");

  const { address } = useAccount();
  // const address = "0x1f019f577cf5325f5e12e9ba88f9f828914e7564";

  const [disabled, setDisabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dataJson, setDataJson] = useState("[]")

  const [balance, setBalance] = useState(0)

  const assetAddr = version === 1 ? optNFTAddress : optNFTV2Address
  const assetAbi = version === 1 ? optNFTAbi : optNFTV2Abi

  const {} = useContractRead({
    addressOrName: assetAddr,
    contractInterface: assetAbi,
    functionName: "balanceOf",
    overrides: { from: address },
    args: [address],
    onSuccess(data) {
      setBalance(Number(data))
    }
  })

  useEffect(() => {
    if(balance > 0) {
      fetch("/apc/upgrade/", {
        method: "POST",
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: "address=" + address + "&contract=" + assetAddr
      }).then( res => {
        if(res.ok) {
          return res.json()
        }
        throw res;
      }).then( data => {
        if(data.Code == 0) {
          let d : FopObj[] = data.Data
          setDataJson(JSON.stringify(d))
        } else {
          
        }
      }).catch(err => {
        //setErrMsg(err)
      })
    }
  }, [balance])












  const FopItem: NextPage<{item: FopObj, version: number}> = ({ item, version }) => {
    const { t } = useTranslation("common");
    const [disabled, setDisabled] = useState(false);
    const [processing, setProcessing] = useState(false);

    const {} = useContractRead({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "calculateAvailable",
      overrides: { from: address },
      args: [version, item.TokenId],
      onSuccess(data) {
      }
    })

    const { config: _claimConfig, error: _claimerror } = usePrepareContractWrite({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "claimV" + version,
      overrides: { from: address },
      args: [item.TokenId],
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
      },
    });

    const handleClaim = (e: any) => {
      setDisabled(true)
      setProcessing(true)
      claimWrite?.()
    }

    const cmpReward = () => {
      return (item.Len * estimatedXEN(Number(globalRank), {
        amplifier: item.Amp,
        term: BigNumber.from(item.Term),
        rank: BigNumber.from(item.Crank),
      })).toFixed(0)
    }

    return (
      <tr>
        <td>{item.Len}</td>
        <td>{item.TokenId}</td>
        <td>{item.Crank}</td>
        <td>{item.Term}</td>
        <td>{formatDate(Number(item.MaturityTs))}</td>
        <td>
          {cmpReward()}
        </td>
        <td>
          <button
              type="button"
              className={clsx("btn btn-xs glass text-neutral ml-2", {
                loading: processing,
              })}
              onClick={handleClaim.bind(this)}
              disabled={timeNow <= item.MaturityTs ? true : disabled}
          >
              {t("mapping.mining.btn.claim")}
          </button>
        </td>
      </tr>
    )
  }

  return (
    <CardContainer>
      <h2 className="card-title">{t("mapping.fop.title-v" + version)}: Balance {balance}</h2>
      <div className="text-right">
        <button type="button" className="btn btn-xs glass text-neutral ml-2">
          {t("mapping.fop.btn.approve-v" + version)}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="lg:table-cell">{t("mapping.mining.tb.count")}</th>
              <th className="lg:table-cell">{t("mapping.mining.tb.round")}</th>
              <th className="lg:table-cell">paiming</th>
              <th className="lg:table-cell">{t("mapping.mining.tb.term")}</th>
              <th className="lg:table-cell">{t("mapping.mining.tb.maturity")}</th>
              <th className="lg:table-cell">{t("mapping.mining.tb.reward")}</th>
              <th className="lg:table-cell">{t("batch.tb.action")}</th>
            </tr>
          </thead>
          <tbody>
            {JSON.parse(dataJson)?.map((item: FopObj, index: any) => (
                <FopItem item={item} version={version} key={index}/>
            ))}
          </tbody>
        </table>
      </div>
    </CardContainer>
  )
}

export async function getStaticProps({ locale }: any) {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["common"])),
      },
    };
  }
  
export default MapFop;