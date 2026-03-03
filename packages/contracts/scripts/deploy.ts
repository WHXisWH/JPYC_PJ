/**
 * デプロイスクリプト
 *
 * Amoy テストネット:
 *   npx hardhat run scripts/deploy.ts --network amoy
 *
 * Polygon メインネット:
 *   npx hardhat run scripts/deploy.ts --network polygon
 *
 * ローカル:
 *   npx hardhat run scripts/deploy.ts
 */

import { ethers, network, run } from 'hardhat';

// 検証まで待機するブロック数
const VERIFY_WAIT_BLOCKS = 5;

// ネットワーク別のJPYCトークンアドレス
const JPYC_ADDRESSES: Record<string, string> = {
  polygon: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BF6', // Polygon PoS JPYC v2
  amoy:    '',  // テストネット用は MockERC20 をデプロイ（下記で自動対応）
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const networkName = network.name;

  console.log('====================================');
  console.log(`ネットワーク  : ${networkName} (chainId: ${chainId})`);
  console.log(`デプロイヤー  : ${deployer.address}`);
  console.log(`残高          : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log('====================================\n');

  // プラットフォーム手数料受取アドレス（デフォルト: デプロイヤー自身）
  const platformFeeRecipient =
    process.env.PLATFORM_FEE_RECIPIENT || deployer.address;

  // -----------------------------------------------------------------------
  // 1. JPYCトークンアドレスの決定
  // -----------------------------------------------------------------------

  let jpycAddress = process.env.JPYC_TOKEN_ADDRESS || JPYC_ADDRESSES[networkName] || '';

  if (!jpycAddress) {
    // Amoy テストネット等、既知アドレスがない場合は MockERC20 をデプロイ
    console.log('⚠  JPYC アドレス未設定。MockERC20 をデプロイします...');
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const mock = await MockERC20.deploy();
    await mock.waitForDeployment();
    jpycAddress = await mock.getAddress();
    console.log(`✅ MockERC20 デプロイ完了: ${jpycAddress}\n`);
  } else {
    console.log(`ℹ  JPYC アドレス: ${jpycAddress}\n`);
  }

  // -----------------------------------------------------------------------
  // 2. AccessPassNFT デプロイ
  // -----------------------------------------------------------------------

  console.log('📦 AccessPassNFT をデプロイ中...');
  const AccessPassNFT = await ethers.getContractFactory('AccessPassNFT');
  const accessPass = await AccessPassNFT.deploy('NodeStay Pass', 'NSP');
  await accessPass.waitForDeployment();
  const accessPassAddress = await accessPass.getAddress();
  console.log(`✅ AccessPassNFT: ${accessPassAddress}`);

  // -----------------------------------------------------------------------
  // 3. DepositVault デプロイ
  // -----------------------------------------------------------------------

  console.log('\n📦 DepositVault をデプロイ中...');
  const DepositVault = await ethers.getContractFactory('DepositVault');
  const vault = await DepositVault.deploy(jpycAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ DepositVault: ${vaultAddress}`);

  // -----------------------------------------------------------------------
  // 4. ComputeMarket デプロイ
  // -----------------------------------------------------------------------

  console.log('\n📦 ComputeMarket をデプロイ中...');
  const ComputeMarket = await ethers.getContractFactory('ComputeMarket');
  const market = await ComputeMarket.deploy(jpycAddress, platformFeeRecipient);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log(`✅ ComputeMarket: ${marketAddress}`);

  // -----------------------------------------------------------------------
  // 5. デプロイ結果サマリー
  // -----------------------------------------------------------------------

  console.log('\n====================================');
  console.log('デプロイ完了 🎉');
  console.log('====================================');
  console.log(`ネットワーク          : ${networkName}`);
  console.log(`JPYC トークン         : ${jpycAddress}`);
  console.log(`AccessPassNFT         : ${accessPassAddress}`);
  console.log(`DepositVault          : ${vaultAddress}`);
  console.log(`ComputeMarket         : ${marketAddress}`);
  console.log(`platformFeeRecipient  : ${platformFeeRecipient}`);
  console.log('====================================\n');

  // -----------------------------------------------------------------------
  // 6. Polygonscan コントラクト検証（Amoy / Polygon のみ）
  // -----------------------------------------------------------------------

  if (networkName === 'amoy' || networkName === 'polygon') {
    const apiKey = process.env.POLYGONSCAN_API_KEY;
    if (!apiKey) {
      console.log('⚠  POLYGONSCAN_API_KEY が未設定のため、検証をスキップします。');
      return;
    }

    console.log(`\n🔍 Polygonscan でコントラクトを検証中（${VERIFY_WAIT_BLOCKS} ブロック待機）...`);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // ブロック確認を待つ（約 ${VERIFY_WAIT_BLOCKS * 2} 秒）
    await sleep(VERIFY_WAIT_BLOCKS * 2000);

    const verify = async (address: string, constructorArgs: unknown[]) => {
      try {
        await run('verify:verify', { address, constructorArguments: constructorArgs });
        console.log(`  ✅ 検証完了: ${address}`);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes('Already Verified')) {
          console.log(`  ℹ  既に検証済み: ${address}`);
        } else {
          console.error(`  ❌ 検証失敗: ${address}`, e);
        }
      }
    };

    await verify(accessPassAddress, ['NodeStay Pass', 'NSP']);
    await verify(vaultAddress, [jpycAddress]);
    await verify(marketAddress, [jpycAddress, platformFeeRecipient]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
