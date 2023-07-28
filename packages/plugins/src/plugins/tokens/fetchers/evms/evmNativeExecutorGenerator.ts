import {
  EvmNetworkIdType,
  PortfolioElementSingle,
  PortfolioElementType,
  networks,
} from '@sonarwatch/portfolio-core';
import { getAddress } from 'viem';
import BigNumber from 'bignumber.js';
import { FetcherExecutor } from '../../../../Fetcher';
import { getEvmClient } from '../../../../utils/clients';
import { walletTokensPlatform } from '../../../../platforms';
import tokenPriceToAssetToken from '../../../../utils/misc/tokenPriceToAssetToken';
import { Cache } from '../../../../Cache';

export default function getEvmFetcherNativeExecutor(
  networkId: EvmNetworkIdType
): FetcherExecutor {
  return async (owner: string, cache: Cache) => {
    const client = getEvmClient(networkId);
    const { address } = networks[networkId].native;
    const tokenPrice = await cache.getTokenPrice(address, networkId);
    if (!tokenPrice) return [];

    const balance = await client.getBalance({ address: getAddress(owner) });
    if (!balance) return [];

    const amount = new BigNumber(balance.toString())
      .div(10 ** tokenPrice.decimals)
      .toNumber();
    const asset = tokenPriceToAssetToken(
      address,
      amount,
      networkId,
      tokenPrice
    );
    const element: PortfolioElementSingle = {
      type: PortfolioElementType.single,
      networkId,
      platformId: walletTokensPlatform.id,
      label: 'Wallet',
      value: asset.value,
      data: {
        asset,
      },
    };
    return [element];
  };
}
