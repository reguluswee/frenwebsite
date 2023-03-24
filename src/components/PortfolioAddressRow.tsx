import type { NextPage } from "next";
import {
  truncatedAddress,
  estimatedXEN,
  estimatedStakeRewardXEN,
} from "~/lib/helpers";
import { useEffect, useState } from "react";
import { formatDate, formatTime } from "~/lib/helpers";
import { XIcon } from "@heroicons/react/outline";
import useXENAddressBalance from "~/hooks/useXENAddressBalance";

export const PortfolioAddressRow: NextPage<any> = (props) => {
  const [mintReward, setMintReward] = useState(0);
  const [stakeReward, setStakeReward] = useState(0);

  const { mintData: userMintData } =
    useXENAddressBalance({
      address: props.item.address,
      chain: props.chain,
    });

  useEffect(() => {
    if (userMintData && props && props.globalRankData) {
      const reward = estimatedXEN(props.globalRankData, userMintData);
      props.item.mint = reward;
      setMintReward(reward);
    }
  }, [
    userMintData,
    props.globalRankData,
    props,
    props.index,
    props.item,
  ]);

  return (
    <>
      <td className="bg-transparent">
        <button
          name="delete"
          id="delete"
          type="button"
          className="btn btn-square btn-xs glass text-neutral"
          onClick={() => {
            props.remove(props.index);
            const updatedAddresses = props.storedAddresses.filter(
              (address: string) => address !== props.item.address
            );
            props.setStoredAddresses(updatedAddresses);
          }}
        >
          <XIcon className="w-4 h-4" />
        </button>
      </td>
      <td className="bg-transparent">
        <pre>{truncatedAddress(props.item.address)}</pre>
      </td>
      <td className="bg-transparent text-right">
        <pre>
          {mintReward.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </pre>
      </td>
      <td className="bg-transparent text-right">
        {!userMintData?.maturityTs.isZero() ? (
          <>
            <pre>{formatDate(userMintData?.maturityTs.toNumber() ?? 0)}</pre>
            <pre>{formatTime(userMintData?.maturityTs.toNumber() ?? 0)}</pre>
          </>
        ) : (
          <>
            <pre>-</pre>
            <pre>-</pre>
          </>
        )}
      </td>
      <td className="bg-transparent text-right">
        <pre>
          {stakeReward.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </pre>
      </td>
    </>
  );
};

export default PortfolioAddressRow;
