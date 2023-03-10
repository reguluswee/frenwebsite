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
  
  import CardContainer from "~/components/containers/CardContainer";
  import Link from "next/link";
  
  import { useForm } from "react-hook-form";
  import { clsx } from "clsx";
  
  import toast from "react-hot-toast";
  import { ethers, BigNumber } from "ethers";

  var Web3 = require("web3");
  var provider = new Web3.providers.HttpProvider("https://rpc.etherfair.org")
  var web3 = new Web3(provider)

  const mdaoContractAddress = '0xcDfd138a8E59916E687F869f5c9D6B6f4334aE73'

  const mintMethod = 'mint(uint256,uint256)'
  const claimMethod = 'claim(uint256,uint256)'
  const mdaoStartBlock = 15782000
  const mdaoEndBlock = 16639289

  const mintHash = web3.utils.keccak256(mintMethod).substring(0, 10)
  const claimHash = web3.utils.keccak256(claimMethod).substring(0, 10)

  const frenEventRewardMethod = 'MintClaimed(address,uint256)'
  const frenEventRewardHash = web3.utils.keccak256(frenEventRewardMethod)
  
  const Compensate = () => {
    const { t } = useTranslation("common");
  
    const { address } = useAccount();
    const { chain } = useNetwork();
    const router = useRouter();
    const [disabled, setDisabled] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [errMsg, setErrMsg] = useState("");
    const [startBlockHeight, setStartBlockHeight] = useState(mdaoStartBlock);
    const [txRecord, setTxRecord] = useState<any[]>();

    const getBlock = async(height: Number) => {
      let block = await web3.eth.getBlock(height);
      return block;
  }
  
  const getTxReceipt = async(tx: string) => {
      let receipt = await web3.eth.getTransactionReceipt(tx);
      return receipt;
  }
  const getTxOriginal = async(tx: string) => {
      let txInput = await web3.eth.getTransaction(tx);
      return txInput;
  }
  const analysisWallet = async (wallet: any, fromHeight: number, toHeight: any) => {
      let txList = [];
      if(!toHeight) {
          toHeight = mdaoEndBlock;
      }
      for(; fromHeight < toHeight; ) {
          let blockInfo = await getBlock(fromHeight)
          let txsInBlock = blockInfo.transactions;
          let tmpTxs = []
          for(var i in txsInBlock) {
              let txReceipt = await getTxReceipt(txsInBlock[i]);
              let txInput = await getTxOriginal(txsInBlock[i]);
  
              if(txReceipt.from==wallet.toLowerCase() && txReceipt.to==mdaoContractAddress.toLowerCase()) {
                  if(txInput.input.substring(0, 10) == claimHash) {
                      let logs = []
                      let rewardsTotal = BigNumber.from(0)
                      for(let j in txReceipt.logs) {
                          if(txReceipt.logs[j].address.toLowerCase() == '0x7127deeff734cE589beaD9C4edEFFc39C9128771'.toLowerCase() 
                              && txReceipt.logs[j].topics[0] == frenEventRewardHash.toLowerCase()) {
                              logs.push(web3.utils.hexToNumberString(txReceipt.logs[j].data))
                              rewardsTotal = BigNumber.from(txReceipt.logs[j].data).add(rewardsTotal)
                          }
                      }
                      let minterNum = txInput.input.substring(10).substring(0, 64)
                      let term = txInput.input.substring(10).substring(64)
                      
                      tmpTxs.push({
                          hash: txsInBlock[i],
                          timestamp: blockInfo.timestamp,
                          minterNum: minterNum,
                          term: term,
                          rewardsTotal: (rewardsTotal.div(BigNumber.from(10**18 + ''))).toNumber(),
                          rewardsDetail: logs
                      });
                  }
              }
          }
          // if(tmpTxs.length > 0) {
          //     console.log('统计区块高：', fromHeight, " 包含交易数：", tmpTxs.length);
          // }
          fromHeight++;
          txList.push(...tmpTxs);
      }
      return txList;
  }

    const {
        handleSubmit,
      } = useForm({
        mode: "onChange",
      });
  
    /*** CONTRACT WRITE SETUP ***/
    const onSubmit = () => {
        //write?.();
        // analysisWallet(address, startBlockHeight, mdaoEndBlock)
        setTxRecord(undefined)
        setProcessing(true)
        setDisabled(true)
        analysisWallet('0xc5144c03b33dfbd8f55721f6c4c4a9eb2774d060', 16639218, mdaoEndBlock).then( resultData => {
          setTxRecord(resultData)
          setDisabled(false)
          setProcessing(false)
        })
    };
  
    /*** USE EFFECT ****/
  
    useEffect(() => {
      if (!processing) {
        setDisabled(false);
      }

      setDisabled(false);
    }, [
      address,
      startBlockHeight,
      processing,
    ]);
  
    return (
      <Container className="max-w-2xl">
        <div className="flew flex-row space-y-8 ">
          <ul className="steps w-full">
            <Link href="/batch/fop">
              <a className="step step-neutral">test and compute</a>
            </Link>
  
            <Link href="/batch/saving">
              <a className="step">collecting</a>
            </Link>

            <Link href="/multi/tokens">
              <a className="step">compensate</a>
            </Link>
          </ul>
  
          <CardContainer>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">
                Fren labs creates this tool as a one time compensation for our loyal users who losed their $fren for using MemorySwap Batch Tool
                </h2>
                <div className="form-control w-full">
                    <label className="label text-neutral">
                        <span className="label-text text-neutral">Start Block</span>
                        <span className="label-text-alt text-error">{errMsg}</span>
                    </label>
                    <input
                        type="number"
                        placeholder="1"
                        className="input input-bordered w-full text-neutral"
                        value={startBlockHeight}
                        onChange={e => setStartBlockHeight(Number(e.target.value))}
                    />
                    <label className="label">
                        <span className="label-text-alt text-neutral">This operation might take a very long time, please be patient.</span>
                    </label>
                </div>
  
                <div className="form-control w-full">
                  <button
                    type="submit"
                    className={clsx("btn glass text-neutral", {
                      loading: processing,
                    })}
                    disabled={disabled}
                  >
                    Compute My Loss
                  </button>
                </div>
              </div>
            </form>
          </CardContainer>

          <CardContainer>
            <h2 className="card-title">Tx Record</h2>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="hidden lg:table-cell">Tx Hash</th>
                    <th className="hidden lg:table-cell">Mint Num</th>
                    <th className="hidden lg:table-cell">Term</th>
                    <th className="hidden lg:table-cell">Claimed Reward</th>
                    <th className="hidden lg:table-cell">Lossed Reward</th>
                  </tr>
                </thead>
                <tbody>
                {txRecord?.map((item, index) => (
                    <tr>
                      <td>
                        <a href={"https://www.oklink.com/zh-cn/ethf/tx/" + item.hash} rel="noopener" target="_blank" className="label-text-alt text-neutral">
                        {item.hash.substring(0, 8) + '...'}
                        </a>
                      </td>
                      <td>{web3.utils.hexToNumber('0x' + item.minterNum)}</td>
                      <td>{web3.utils.hexToNumber('0x' + item.term)}</td>
                      <td>{item.rewardsTotal}</td>
                      <td>{item.rewardsTotal * 99}</td>
                    </tr>
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
    
export default Compensate;