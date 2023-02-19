import type { NextPage } from "next";
import Container from "~/components/containers/Container";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useContractRead, useToken, useNetwork, erc20ABI } from "wagmi";
import {
  NumberStatCard,
  ChainStatCard,
  DateStatCard,
  DataCard,
} from "~/components/StatCards";
import CardContainer from "~/components/containers/CardContainer";
import { xenContract } from "~/lib/xen-contract";
import { chainIcons } from "~/components/Constants";
import Link from "next/link";
import XENContext from "~/contexts/XENContext";
import { useTranslation } from "next-i18next";
import { chainList } from "~/lib/client";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Breadcrumbs from "~/components/Breadcrumbs";
import { useEnvironmentChains } from "~/hooks/useEnvironmentChains";
import { BigNumber } from "ethers";
import {
  multiContract
} from "~/lib/batch-contract";

const TreasuryGeneral: NextPage = () => {
  const { t } = useTranslation("common");
  const { envChains } = useEnvironmentChains();
  const { chain } = useNetwork();

  const router = useRouter();
  const { chainId } = router.query as unknown as { chainId: number };
  const chainFromId = envChains.find((c) => c && c.id == chainId);

  const [balFczz, setBalFczz] = useState(0);
  const [balFren, setBalFren] = useState(0);

  const {
    setChainOverride,
    treasuryBalance,
  } = useContext(XENContext);

  const { data: token } = useToken({
    address: xenContract(chainFromId).addressOrName,
    chainId: chainFromId?.id,
  });

  const {} = useContractRead({
    addressOrName: '0x6593900a9BEc57c5B80a12d034d683e2B89b7C99',
    contractInterface: erc20ABI,
    functionName: "balanceOf",
    args:["0x73d24160cBE2145c68466cc8940fcd34f6614576"],
    onSuccess(data) {
      let result : BigNumber = BigNumber.from(data)
      if(result) {
        setBalFczz(result.div(BigNumber.from(1e18 + '')).toNumber())
      }
    },
    cacheOnBlock: true,
  });
  const {} = useContractRead({
    addressOrName: '0x7127deeff734cE589beaD9C4edEFFc39C9128771',
    contractInterface: erc20ABI,
    functionName: "balanceOf",
    args:["0x73d24160cBE2145c68466cc8940fcd34f6614576"],
    onSuccess(data) {
      let result : BigNumber = BigNumber.from(data)
      if(result) {
        setBalFren(result.div(BigNumber.from(1e18 + '')).toNumber())
      }
    },
    cacheOnBlock: true,
  });

  const tokenList = [
    {
      title: "ETHF",
      value: treasuryBalance ? treasuryBalance.value.div(BigNumber.from(1e18 + ''))?.toNumber() : 0,
      tooltip: "A fork of Ethereum that keeps POW. Anyone can participate without restrictions"
    },
    {
      title: "FCZZ",
      value: balFczz,
      tooltip: "CZZ is the first public chain to realize decentralized cross-chain transaction."
    },
    {
      title: "FREN",
      value: balFren,
      tooltip: `Designed to allow creation of innovative
      structured and collateralized spot and option products by POWP(Proof of
      Work and Proof of Participation)`
    },
  ];

  useEffect(() => {
    if (chainFromId) {
      setChainOverride(chainFromId);
    }
  }, [chainFromId, setChainOverride]);

  return (
    <div>
      <Container className="max-w-2xl">
        <Breadcrumbs />

        <div className="flex flex-col space-y-8">
          <CardContainer>
            <h2 className="card-title">{t("treasury-info.title")}</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              {tokenList.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  tooltip={item.tooltip}
                />
              ))}
            </div>
          </CardContainer>
        </div>
      </Container>
    </div>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

// export const getStaticPaths = async ({ locales }: any) => {
//   // generate locales paths for all chains and all locales
//   const allPaths = chainList.flatMap((chain) =>
//     locales.map((locale: string) => ({
//       params: { chainId: chain.id.toString() },
//       locale,
//     }))
//   );

//   return {
//     paths: allPaths,
//     fallback: false,
//   };
// };

export default TreasuryGeneral;
