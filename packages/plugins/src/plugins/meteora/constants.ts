import { PublicKey } from '@solana/web3.js';

export const platformId = 'meteora';
export const prefixVaults = `${platformId}-vaults`;

export const vaultsProgramId = new PublicKey(
  '24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi'
);

export const poolsProgramId = new PublicKey(
  'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'
);
