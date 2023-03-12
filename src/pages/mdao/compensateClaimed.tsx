import {
    useNetwork,
    useAccount,
  } from "wagmi";
  
  import { serverSideTranslations } from "next-i18next/serverSideTranslations";
  import Container from "~/components/containers/Container";
  import { useRouter } from "next/router";
  import { useEffect, useState } from "react";
  import { useTranslation } from "next-i18next";
  
  import CardContainer from "~/components/containers/CardContainer";
  import Link from "next/link";
  
  import { useForm } from "react-hook-form";
  import { clsx } from "clsx";
  
  import toast from "react-hot-toast";
  import { ethers, BigNumber } from "ethers";

  var provider = new ethers.providers.JsonRpcProvider("https://rpc.etherfair.org")

  const mdaoContractAddress = '0xcDfd138a8E59916E687F869f5c9D6B6f4334aE73'

  const mintMethod = ethers.utils.toUtf8Bytes('mint(uint256,uint256)')
  const claimMethod = ethers.utils.toUtf8Bytes('claim(uint256,uint256)')
  const mdaoStartBlock = 15782000
  const mdaoEndBlock = 16639289

  const mintHash = ethers.utils.keccak256(mintMethod).substring(0, 10)
  const claimHash = ethers.utils.keccak256(claimMethod).substring(0, 10)

  const frenEventRewardMethod = ethers.utils.toUtf8Bytes('MintClaimed(address,uint256)')
  const frenEventRewardHash = ethers.utils.keccak256(frenEventRewardMethod)

  const diffAmount = BigNumber.from(99999).mul(BigNumber.from(10 ** 18 + ''));
  const diffTimes = BigNumber.from(99);
  
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
    const [currentBlock, setCurrentBlock] = useState(0);
    const [statusText, setStatusText] = useState('');

    const getBlock = async(height: number) => {
      let block = await provider.getBlock(height);
      return block;
    }
  
    const getTxReceipt = async(tx: string) => {
        let receipt = await provider.getTransactionReceipt(tx);
        return receipt;
    }

    const getTxOriginal = async(tx: string) => {
        let txInput = await provider.getTransaction(tx);
        return txInput;
    }

    const getTxInputAndReceipt = async(tx: string) => {
      const txInput = await getTxOriginal(tx);
      const txReceipt = await getTxReceipt(tx);
      return {
        input: txInput,
        receipt: txReceipt
      }
    }

    const sleep = (ms: number) => new Promise(
      resolve => setTimeout(resolve, ms)
    );

    const analysisWallet = async (wallet: any, fromHeight: number, toHeight: any) => {
      let txList : any[] = [];
      if(!toHeight) {
          toHeight = mdaoEndBlock;
      }

      for(; fromHeight <= toHeight; ) {
        setCurrentBlock(fromHeight);
        let blockInfo = await getBlock(fromHeight)
        let txsInBlock = blockInfo.transactions;

        let blockTxSize = txsInBlock.length
        let index = -1
        let executedIndex = 0;
        while(++index <= blockTxSize - 1) {
          let tx = txsInBlock[index];
          getTxInputAndReceipt(tx).then(v => {
            let txReceipt = v.receipt
            let txInput = v.input

            if(txReceipt.from.toLowerCase()==wallet.toLowerCase() 
              && txReceipt.to.toLowerCase()==mdaoContractAddress.toLowerCase()
              && txReceipt.status==1) {
              if(txInput.data.substring(0, 10) == claimHash) {
                let logs = []
                let rewardsTotal = BigNumber.from(0)
                let lossTotal = BigNumber.from(0)
                let minterNum = txInput.data.substring(10).substring(0, 64)
                let term = BigNumber.from('0x' + txInput.data.substring(10).substring(64)).toNumber();
                for(let j in txReceipt.logs) {
                  if(txReceipt.logs[j].address.toLowerCase() == '0x7127deeff734cE589beaD9C4edEFFc39C9128771'.toLowerCase() && txReceipt.logs[j].topics[0] == frenEventRewardHash.toLowerCase()) {
                    let singleData = BigNumber.from(txReceipt.logs[j].data);
                    logs.push(singleData.toHexString())
                    rewardsTotal = singleData.add(rewardsTotal)
                    if(Number(term) > 10 && singleData.lt(diffAmount)) {
                      lossTotal = singleData.mul(diffTimes).add(lossTotal);
                    }
                  }
                }
                let rewardsTotalNumber = (rewardsTotal.div(BigNumber.from(10**18 + ''))).toNumber()
                let lossTotalNumber = lossTotal.div(BigNumber.from(10 ** 18 + '')).toNumber()
                txList.push({
                  hash: tx,
                  timestamp: blockInfo.timestamp,
                  minterNum: minterNum,
                  term: term,
                  rewardsTotal: rewardsTotalNumber,
                  rewardsDetail: logs,
                  rewardsLoss: lossTotalNumber
                })
                setTxRecord(txList);
              }
            }
            executedIndex++;
          })
        }
        while(executedIndex <= blockTxSize - 1) {
          await sleep(50)
        }
        fromHeight++;
      }
    }

    const {
        handleSubmit,
      } = useForm({
        mode: "onChange",
      });
  
    /*** CONTRACT WRITE SETUP ***/
    const onSubmit = () => {
        //write?.();
        setTxRecord(undefined)
        setProcessing(true)
        setDisabled(true)
        setStatusText('block scanning')
        // analysisWallet('0xc5144c03b33dfbd8f55721f6c4c4a9eb2774d060', 16368128, 16368128 + 1)
        
        analysisWallet(address, startBlockHeight, mdaoEndBlock).then( resultData => {
          setDisabled(false)
          setProcessing(false)
          setStatusText('block scan finish')
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
                        <span className="label-text-alt text-error">{statusText}: {currentBlock}</span>
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
                    <tr key={index}>
                      <td>
                        <a href={"https://www.oklink.com/zh-cn/ethf/tx/" + item.hash} rel="noreferrer" target="_blank">
                        {item.hash.substring(0, 8) + '...'}
                        </a>
                      </td>
                      <td>{BigNumber.from('0x' + item.minterNum).toNumber()}</td>
                      <td>{item.term}</td>
                      <td>{item.rewardsTotal}</td>
                      <td>{item.rewardsLoss}</td>
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