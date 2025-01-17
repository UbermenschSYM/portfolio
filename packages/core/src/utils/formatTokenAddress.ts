import { getAddress } from '@ethersproject/address';
import { NetworkIdType } from '../Network';
import { AddressSystem, AddressSystemType } from '../Address';
import { networks } from '../constants';
import {
  assertBitcoinTokenAddress,
  assertEvmTokenAddress,
  assertMoveTokenAddress,
  assertSolanaTokenAddress,
} from './validTokenAddress';

export function formatBitcoinTokenAddress(address: string) {
  assertBitcoinTokenAddress(address);
  return address;
}

export function formatMoveTokenAddress(address: string) {
  assertMoveTokenAddress(address);
  return address
    .trim()
    .replace('::', '__')
    .replace(',', '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

export function formatEvmTokenAddress(address: string) {
  assertEvmTokenAddress(address);
  return getAddress(address.toLocaleLowerCase());
}

export function formatSolanaTokenAddress(address: string) {
  assertSolanaTokenAddress(address);
  return address;
}

const formatters: Record<AddressSystemType, (address: string) => string> = {
  [AddressSystem.solana]: formatSolanaTokenAddress,
  [AddressSystem.bitcoin]: formatBitcoinTokenAddress,
  [AddressSystem.evm]: formatEvmTokenAddress,
  [AddressSystem.move]: formatMoveTokenAddress,
};

export function formatTokenAddress(address: string, networkId: NetworkIdType) {
  const network = networks[networkId];
  if (!network) throw new Error(`NetworkId not supported: ${networkId}`);

  const formatter = formatters[network.addressSystem];
  return formatter(address);
}
