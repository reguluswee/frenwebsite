import type { NextPage } from "next";
import Container from "~/components/containers/Container";
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { useToken } from "wagmi";
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

const Dashboard: NextPage = () => {
  const { t } = useTranslation("common");
  const { envChains } = useEnvironmentChains();

  const router = useRouter();
  const { chainId } = router.query as unknown as { chainId: number };
  const chainFromId = envChains.find((c) => c && c.id == chainId);

  const {
    setChainOverride,
    globalRank,
    activeMinters,
    totalSupply,
    activeStakes,
    totalFrenStakedAmount,
    totalFrenStakedTerm,
    currentMaxTerm,
    genesisTs,
    launchTs,
    currentEAAR,
    currentAPY,
  } = useContext(XENContext);

  const { data: token } = useToken({
    address: xenContract(chainFromId).addressOrName,
    chainId: chainFromId?.id,
  });

  const generalStats = [
    {
      title: t("card.global-rank"),
      value: globalRank,
    },
    {
      title: t("card.active-mints"),
      value: activeMinters,
    },
    {
      title: t("card.active-stakes"),
      value: activeStakes,
    },
    {
      title: t("card.average-stake-term"),
      value: totalFrenStakedTerm,
    },
    {
      title: t("card.max-mint-term"),
      value: currentMaxTerm / 86400,
      suffix: " Days",
    },
  ];

  const lockForMapping = 5500000000000 * 1e18
  const stakeItems = [
    {
      title: t("card.lock-premine"),
      value: lockForMapping / 1e18,
    },
    {
      title: t("card.total"),
      value: (totalSupply + totalFrenStakedAmount - lockForMapping) / 1e18,
    },
    {
      title: t("card.liquid"),
      value: (totalSupply - lockForMapping) / 1e18,
    },
    {
      title: t("card.staked"),
      value: (totalFrenStakedAmount) / 1e18,
    },
  ];

  const rewardsItems = [
    {
      title: t("dashboard.eaa"),
      value: currentEAAR / 10.0,
      decimals: 2,
      suffix: "%",
      tooltip: t("dashboard.eaa-description"),
    },
    {
      title: t("dashboard.apy"),
      value: currentAPY,
      decimals: 0,
      suffix: "%",
      tooltip: t("dashboard.apy-description"),
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
          <div className="dropdown dropdown-hover">
            <label tabIndex={0} className="btn m-1 glass text-neutral">
              {t("dashboard.select-chain")}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow rounded-box glass w-64 flex space-y-2"
            >
              {envChains.map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/${c.id}`}>
                    <a className="text-neutral justify-between glass">
                      {c.name}
                      {chainIcons[c.id]}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <CardContainer>
            <h2 className="card-title">{t("dashboard.general-stats")}</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              <ChainStatCard
                value={chainFromId?.name ?? "Ethereum"}
                id={chainFromId?.id ?? 1}
              />
              <DateStatCard
                title={t("dashboard.days-since-launch")}
                dateTs={genesisTs}
                isPast={true}
              />
              <DateStatCard
                title={t("dashboard.days-since-upgrade")}
                dateTs={launchTs}
                isPast={true}
              />
              {token && (
                <DataCard
                  title={t("dashboard.token-address")}
                  value={token?.symbol ?? "FREN"}
                  description={xenContract(chainFromId).addressOrName}
                />
              )}

              {generalStats.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  decimals={0}
                  suffix={item.suffix}
                />
              ))}
            </div>
          </CardContainer>

          <CardContainer>
            <h2 className="card-title">{t("dashboard.supply")}</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              {stakeItems.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </div>
          </CardContainer>

          <CardContainer>
            <h2 className="card-title">{t("dashboard.rewards")}</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              {rewardsItems.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  decimals={item.decimals}
                  suffix={item.suffix}
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

export const getStaticPaths = async ({ locales }: any) => {
  // generate locales paths for all chains and all locales
  const allPaths = chainList.flatMap((chain) =>
    locales.map((locale: string) => ({
      params: { chainId: chain.id.toString() },
      locale,
    }))
  );

  return {
    paths: allPaths,
    fallback: false,
  };
};

export default Dashboard;
