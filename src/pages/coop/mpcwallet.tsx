import {
    useAccount,
    useContractWrite,
    useWaitForTransaction,
    usePrepareContractWrite,
    useContractRead,
  } from "wagmi";
  
  import { serverSideTranslations } from "next-i18next/serverSideTranslations";
  import Container from "~/components/containers/Container";
  import { useEffect, useState, useRef } from "react";
  import { useTranslation } from "next-i18next";
  
  import CardContainer from "~/components/containers/CardContainer";
  
  import { useForm } from "react-hook-form";
  import { clsx } from "clsx";
  
  import toast from "react-hot-toast";

  import { MerkleTree } from "merkletreejs";
  import keccak256 from "keccak256";

  import { AllowedList } from "~/abi/mpcwallet";


  const comAbi = [{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"FREN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARDAMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimedAddress","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"name":"modifyRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"proof","type":"bytes32[]"}],"name":"claimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"proof","type":"bytes32[]"}],"name":"verifyReward","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}];
  const comAddr = "0x56C04728ac13Cb5ba5ceBE95497bb2f8A85d6BE7";


  let WalletList = AllowedList.split(/[(\r\n)\r\n]+/);
  WalletList.forEach((item,index)=>{
    if(!item){
      WalletList.splice(index,1);//删除空项
    }
  })

  let leafNodes = WalletList.map(address => keccak256(address));
  let mTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  
  const ActMpcWallet = () => {
    const { t } = useTranslation("common");
  
    const { address } = useAccount();
    const [disabled, setDisabled] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [errMsg, setErrMsg] = useState("");
    const [err, setErr] = useState(false);

    // console.log('Tree Root: ', mTree.getRoot().toString('hex'));
    // let snsArr= AllowedList.split(/[(\r\n)\r\n]+/);
    // snsArr.forEach((item,index)=>{
    //       if(!item){
    //           snsArr.splice(index,1);//删除空项
    //       }
    // })
    // console.log(JSON.stringify(snsArr))

    const {
        handleSubmit,
      } = useForm({
        mode: "onChange",
      });

    /*** CONTRACT WRITE SETUP ***/
    const { config: _20config, error: _20error } = usePrepareContractWrite({
      addressOrName: comAddr,
      contractInterface: comAbi,
      functionName: "claimReward",
      overrides: { from: address },
      args: [mTree.getHexProof(keccak256(address? address:''))],
      onSuccess(data) {
        setErr(false)
        setErrMsg("you are quilified for claiming reward")
        setDisabled(false)
      },
      onError(err) {
        setErr(true)
        let tmpE = JSON.parse(JSON.stringify(err))
        setErrMsg(tmpE.reason)
        setDisabled(true)
      }
    })

    const { data: cliamData, write } = useContractWrite({
      ..._20config,
      onSuccess(data) {
        setProcessing(true);
        setDisabled(true);
      },
    });
    const {} = useWaitForTransaction({
      hash: cliamData?.hash,
      onSuccess(data) {
        toast(t("toast.approve-successful"));
        setProcessing(false);
      },
    });
    const onSubmit = () => {
        write?.();
    };
  
    /*** USE EFFECT ****/
    useEffect(() => {
      if (!processing) {
        setDisabled(false);
      }
    }, [
      address,
      disabled,
      _20config,
      processing,
    ]);
  
    return (
      <Container className="max-w-2xl">
        <div className="flew flex-row space-y-8 ">  
          <CardContainer>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">
                Fren is partnering with MpcWallet to reward each qualified user with 50,000 $FREN, one time only.
                </h2>
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text-alt text-neutral">Checked Result</span>
                        <span className="label-text-alt text-neutral">{errMsg}</span>
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
                    Claim My Reward
                  </button>
                </div>
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
    
export default ActMpcWallet;