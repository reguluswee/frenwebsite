import { daysSince } from "~/components/StatCards";
import { ethers } from "ethers";

const UTC_TIME = new Date().getTime() / 1000;
const WITHDRAWAL_WINDOW_DAYS = 7;
const MAX_PENALTY_PCT = 99;
const DAYS_IN_YEAR = 365;

export const daysRemaining = (timestamp?: number) => {
  if (timestamp && timestamp > 0) {
    return (Number(timestamp) - Date.now() / 1000) / 86400;
  } else {
    return 0;
  }
};

export const percentComplete = (daysRemaining: number, term?: number) => {
  if (term && term > 0) {
    return term - daysRemaining;
  } else {
    return 0;
  }
};

export interface MintData {
  amplifier: number;
  eaaRate: number;
  maturityTs: number;
  rank: number;
  term: number;
  user: string;
  globalRank: number;
  genesisTs: number;
}

export const estimatedXEN = (data?: MintData) => {
  if (data) {
    const EEA = 0.1 - 0.001 * (data.rank / 1e5);

    const XEN =
      Math.log2(data.globalRank - data.rank) *
      data.term *
      data.amplifier *
      (1 + EEA);
    return XEN;
  } else {
    return 0;
  }
};

interface StakeData {
  xenBalance: number;
  genesisTs: number;
  term: number;
  apy: number;
}

export const stakeYield = (data?: StakeData) => {
  if (data) {
    const ds = daysSince(data.genesisTs * 1000);
    const y = (data.xenBalance * data.apy * data.term) / (100 * 365);
    return y;
  } else {
    return 0;
  }
};

export const gasCalculator = (gwei: number) => {
  return ethers.utils.formatUnits(gwei, "gwei");
};

interface MintRewardData {
  maturityTs: number;
  grossReward: number;
}

export const mintPenalty = (maturityTs: number) => {
  const daysLate = (UTC_TIME - maturityTs) / 86400;
  if (daysLate > WITHDRAWAL_WINDOW_DAYS - 1) return MAX_PENALTY_PCT;
  const penalty = (1 << (daysLate + 3)) / WITHDRAWAL_WINDOW_DAYS - 1;
  return Math.min(penalty, MAX_PENALTY_PCT);
};

export const calculateMintReward = (data: MintRewardData) => {
  return (data.grossReward * (100 - mintPenalty(data.maturityTs))) / 100;
};

interface StakeRewardData {
  maturityTs: number;
  term: number;
  amount: number;
  apy: number;
}

export const calculateStakeReward = (data: StakeRewardData) => {
  if (UTC_TIME > data.maturityTs) {
    const rate = (data.apy * data.term * 1_000_000) / DAYS_IN_YEAR;
    return (data.amount * rate) / 100_000_000 / 1e18;
  }
  return 0;
};
