import starkwareLogo from "./assets/starkware-logo.svg";

import { ETH_STANDARD_PATH, MAINNET_CHAIN_ID, SUPPORTED_CHAINS } from "../constants";
import { IAppConfig } from "../helpers/types";
import { getRpcEngine } from "../engines";

export const STARKWARE_SUPPORTED_CHAIN_IDS = [1, 3, 4];

const appConfig: IAppConfig = {
  name: "StarkWare",
  logo: starkwareLogo,
  chainId: MAINNET_CHAIN_ID,
  derivationPath: ETH_STANDARD_PATH,
  numberOfAccounts: 2,
  colors: {
    defaultColor: "40, 40, 110",
    backgroundColor: "25, 24, 46",
  },
  chains: SUPPORTED_CHAINS.filter(x => STARKWARE_SUPPORTED_CHAIN_IDS.includes(x.chain_id)),
  styleOpts: {
    showPasteUri: true,
    showVersion: false,
  },
  rpcEngine: getRpcEngine(),
  events: {
    init: (state, setState) => Promise.resolve(),
    update: (state, setState) => Promise.resolve(),
  },
};

export function getAppConfig(): IAppConfig {
  return appConfig;
}
