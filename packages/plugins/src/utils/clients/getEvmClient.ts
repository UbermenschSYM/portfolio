import { PublicClient, createPublicClient, http } from 'viem';
import { EvmNetworkIdType } from '@sonarwatch/portfolio-core';
import { getBasicAuthHeaders } from '../misc/getBasicAuthHeaders';
import { getRpcEndpoint, viemChainsByNetworkId } from './constants';

export default function getEvmClient(
  evmNetworkId: EvmNetworkIdType
): PublicClient {
  const rpcEndpoint = getRpcEndpoint(evmNetworkId);
  const headers = rpcEndpoint.basicAuth
    ? getBasicAuthHeaders(
        rpcEndpoint.basicAuth.username,
        rpcEndpoint.basicAuth.password
      )
    : undefined;

  return createPublicClient({
    chain: viemChainsByNetworkId[evmNetworkId],
    transport: http(rpcEndpoint.url, {
      fetchOptions: {
        headers,
      },
    }),
  });
}
