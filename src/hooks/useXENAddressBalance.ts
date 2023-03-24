import { Chain, useContractRead } from "wagmi";
import { xenContract } from "~/lib/xen-contract";
import XENCryptoABI from "~/abi/XENCryptoABI";
import { UserMint } from "~/contexts/XENContext";

interface AddressBalanceProps {
  address: string;
  chain: Chain;
}

export const useXENAddressBalance = (props: AddressBalanceProps) => {
  const { data: userMintData } = useContractRead({
    addressOrName: xenContract(props.chain).addressOrName,
    contractInterface: XENCryptoABI,
    functionName: "getUserMint",
    overrides: { from: props.address },
    // watch: true,
  });

  return {
    mintData: userMintData,
  };
};

export default useXENAddressBalance;
