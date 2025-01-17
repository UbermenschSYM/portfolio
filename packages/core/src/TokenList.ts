// Based on https://github.com/Uniswap/token-lists

import { NetworkIdType } from './Network';

export type UniTokenInfoExtensionValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface UniTokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: Record<string, UniTokenInfoExtensionValue>;
}

export type UniTokenList = {
  name: string;
  logoURI?: string;
  keywords: string[];
  timestamp: string;
  tokens: UniTokenInfo[];
  version: {
    major: number;
    minor: number;
    patch: number;
  };
};

export interface TokenInfo extends Omit<UniTokenInfo, 'chainId'> {
  readonly networkId: NetworkIdType;
}
