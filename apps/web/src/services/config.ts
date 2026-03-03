export function getApiBaseUrl(value: string | undefined): string {
  return (value ?? 'http://localhost:3001').replace(/\/+$/, '');
}

// Polygon Amoy テストネット コントラクトアドレス
export const CONTRACT_ADDRESSES = {
  accessPassNFT: process.env.NEXT_PUBLIC_ACCESS_PASS_NFT_ADDRESS ?? '0x1cC076ed23D6c2e5dD37aAe28b9a21aA9d46eC3a',
  depositVault:  process.env.NEXT_PUBLIC_DEPOSIT_VAULT_ADDRESS  ?? '0xb2a5A4354F9b53089893b2aF9840a29cEeEe84fD',
  computeMarket: process.env.NEXT_PUBLIC_COMPUTE_MARKET_ADDRESS ?? '0x159E85E8f296B9a3A95A9FFaE59Ae7aF4358Ee77',
  jpycToken:     process.env.NEXT_PUBLIC_JPYC_TOKEN_ADDRESS     ?? '0x2fA62C3E53b67A9678F4Aac14E2843c1dF7b8AfD',
} as const;

// チェーン設定
export const CHAIN_CONFIG = {
  id:   Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '80002'),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? 'Polygon Amoy',
} as const;

