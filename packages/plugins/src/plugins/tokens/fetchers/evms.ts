import {
  EvmNetworkIdType,
  NetworkId,
  NetworkIdType,
  PortfolioAssetToken,
  PortfolioElementMultiple,
  PortfolioElementType,
  TokenPrice,
  getUsdValueSum,
} from '@sonarwatch/portfolio-core';
import { getAddress } from 'viem';
import { Cache } from '../../../Cache';
import { Fetcher, FetcherExecutor } from '../../../Fetcher';
import { walletTokensPlatform } from '../../../platforms';
import { getEvmClients } from '../../../utils/clients';
import runInBatch from '../../../utils/misc/runInBatch';
import { erc20ABI } from '../../../utils/evm/erc20Abi';
import tokenPriceToAssetToken from '../../../utils/misc/tokenPriceToAssetToken';
import { TokenList } from '../types';

const executor: FetcherExecutor = async (owner: string, cache: Cache) => {
  const clients = getEvmClients();
  const elements: PortfolioElementMultiple[] = [];
  for (const key in clients) {
    if (clients[key as EvmNetworkIdType]) {
      const networkId = key as NetworkIdType;
      const client = clients[networkId as EvmNetworkIdType];
      const tokenList = await cache.getItem<TokenList>(networkId, {
        prefix: 'tokenList',
      });
      if (!tokenList || tokenList.tokens.length === 0) return [];

      const tokensContracts = tokenList.tokens.map((token) => token.address);

      const results = await runInBatch(
        tokensContracts.map(
          (contract) => () => cache.getTokenPrice(contract, networkId)
        )
      );
      const tokenPrices: TokenPrice[] = [];
      results.forEach((r) => {
        if (r.status === 'rejected') return;
        if (!r.value) return;
        tokenPrices.push(r.value);
      });

      const ownerEvmAddress = getAddress(owner);
      const erc20CommonProperties = {
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [ownerEvmAddress],
      } as const;
      const contracts = [];
      for (const tokenPrice of tokenPrices) {
        const address = getAddress(tokenPrice.address);
        const contract = {
          address,
          ...erc20CommonProperties,
        };
        contracts.push(contract);
      }
      const contractsRes = await client.multicall({ contracts });

      const walletTokensAssets: PortfolioAssetToken[] = [];
      for (let index = 0; index < contractsRes.length; index++) {
        const contractRes = contractsRes[index];
        if (contractRes.status === 'failure') continue;
        if (!contractRes.result) continue;

        const tokenPrice = tokenPrices[index];
        const { address } = tokenPrice;
        const amount = Number(contractRes.result) / 10 ** tokenPrice.decimals;
        if (amount === 0) continue;

        const asset = tokenPriceToAssetToken(
          address,
          amount,
          networkId,
          tokenPrice
        );
        walletTokensAssets.push(asset);
      }
      if (walletTokensAssets.length === 0) return [];

      const element: PortfolioElementMultiple = {
        type: PortfolioElementType.multiple,
        networkId: networkId as NetworkIdType,
        platformId: walletTokensPlatform.id,
        label: 'Wallet',
        value: getUsdValueSum(walletTokensAssets.map((a) => a.value)),
        data: {
          assets: walletTokensAssets,
        },
      };
      elements.push(element);
    }
  }
  return elements;
};

const fetcher: Fetcher = {
  id: `${walletTokensPlatform.id}-evms`,
  networkId: NetworkId.ethereum,
  executor,
};

export default fetcher;
