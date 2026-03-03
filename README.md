# Node Stay

ネットカフェ向け**利用権トークン化**と**遊休算力レンタル**を組み合わせた両面マーケットプレイスです。
JPYC（円建てステーブルコイン）決済・Polygon PoS ネットワーク上で動作します。

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [技術スタック](#技術スタック)
4. [ディレクトリ構成](#ディレクトリ構成)
5. [セットアップ](#セットアップ)
6. [開発サーバー起動](#開発サーバー起動)
7. [テスト](#テスト)
8. [スマートコントラクト](#スマートコントラクト)
9. [フロントエンド画面構成](#フロントエンド画面構成)

---

## プロジェクト概要

| マーケット | 内容 |
|---|---|
| 座席利用権市場 | JPYC で利用権NFT（AccessPassNFT）を購入 → QRコードで入店 → チェックアウト時に使用分を消費 |
| 遊休算力市場 | ネットカフェのPC/GPUを時間貸し → ジョブ完了時に店舗75% / プラットフォーム25% で自動分配 |

**決済フロー（座席）**

```
ユーザー → JPYC 送金 → DepositVault (hold)
         → チェックイン（AccessPassNFT.consumePass）
         → チェックアウト → captureDeposit（店舗へ）+ releaseDeposit（おつり返金）
```

**決済フロー（算力）**

```
依頼者 → JPYC エスクロー → ComputeMarket.submitJob
      → ASSIGNED → RUNNING → COMPLETED
      → 店舗 75% + プラットフォーム 25% 自動送金
```

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    apps/web                         │
│          Next.js 14 (App Router) フロントエンド      │
│  表示・状態管理・画面遷移のみ責務。BL は持たない。    │
└──────────────────────┬──────────────────────────────┘
                       │ @nodestay/api-client
┌──────────────────────▼──────────────────────────────┐
│                    apps/api                         │
│         NestJS サービス層（オフチェーン台帳）         │
│  冪等処理・セッション管理・本人確認・証跡             │
└──────────────────────┬──────────────────────────────┘
                       │ ethers.js / typechain
┌──────────────────────▼──────────────────────────────┐
│               packages/contracts                    │
│            Hardhat + Solidity ^0.8.26               │
│  AccessPassNFT / DepositVault / ComputeMarket        │
│          Polygon PoS（Amoy テストネット）             │
└─────────────────────────────────────────────────────┘

共通パッケージ
  packages/domain      … Zod スキーマ・共有型
  packages/api-client  … NodeStayClient（冪等キー付き）
```

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---|---|---|
| フロントエンド | Next.js (App Router) | 14 |
| スタイリング | Tailwind CSS v4 + `@tailwindcss/postcss` | 4 |
| バックエンド | NestJS | - |
| スマートコントラクト | Solidity | ^0.8.26 |
| コントラクト開発環境 | Hardhat + hardhat-toolbox | 2.22 |
| コントラクト標準ライブラリ | OpenZeppelin Contracts | ^5.0 |
| ブロックチェーン | Polygon PoS (chainId: 137) | - |
| テストネット | Polygon Amoy (chainId: 80002) | - |
| 決済トークン | JPYC（ERC-20 円建てステーブルコイン）| - |
| 型生成 | TypeChain (ethers-v6) | - |
| フロントテスト | Vitest + @testing-library/react | - |
| コントラクトテスト | Mocha + Chai（Hardhat 組み込み） | - |
| モノレポ管理 | npm workspaces | - |
| 言語 | TypeScript | ^5.6 |

---

## ディレクトリ構成

```
JPYC_PJ/
├── apps/
│   ├── web/                        # Next.js フロントエンド
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx      # ルートレイアウト（Header / Footer）
│   │       │   ├── globals.css     # Tailwind v4 テーマ定義
│   │       │   ├── page.tsx        # ホームページ
│   │       │   ├── venues/         # 店舗一覧・詳細
│   │       │   ├── passes/         # マイパス
│   │       │   ├── sessions/       # セッション（リアルタイムタイマー）
│   │       │   ├── compute/        # 算力マーケット
│   │       │   └── merchant/
│   │       │       └── compute/    # 店舗向けノード管理
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── Header.tsx  # スクロール対応・JPYC残高表示
│   │       │   │   └── Footer.tsx
│   │       │   └── HealthBadge.tsx
│   │       └── services/
│   │           ├── nodestay.ts     # APIクライアントファクトリ
│   │           └── config.ts
│   └── api/                        # NestJS バックエンド
│       └── src/
│           ├── main.ts
│           └── modules/
│               └── v1/
└── packages/
    ├── contracts/                  # Hardhat プロジェクト
    │   ├── contracts/
    │   │   ├── AccessPassNFT.sol   # 利用権NFT
    │   │   ├── DepositVault.sol    # hold / capture / release
    │   │   ├── ComputeMarket.sol   # 算力マーケット（ジョブ管理）
    │   │   ├── MockERC20.sol       # テスト用トークン
    │   │   └── MockERC20Config.sol
    │   ├── scripts/
    │   │   └── deploy.ts           # デプロイスクリプト
    │   ├── test/
    │   │   ├── accessPass.test.ts
    │   │   ├── computeMarket.test.ts
    │   │   ├── depositVault.test.ts
    │   │   └── mockERC20Config.test.ts
    │   ├── typechain-types/        # 自動生成（npx hardhat compile）
    │   ├── hardhat.config.ts
    │   └── .env                    # 秘密鍵・RPC URL（git 管理外）
    ├── domain/                     # 共有 Zod スキーマ・型定義
    └── api-client/                 # NodeStayClient（冪等キー付き fetch）
```

---

## セットアップ

### 必要環境

- Node.js 20+
- npm 10+

### インストール

```bash
git clone <repository-url>
cd JPYC_PJ
npm install
```

---

## 開発サーバー起動

```bash
# API（NestJS）+ Web（Next.js）同時起動
npm run dev

# Web のみ
npm run dev -w @nodestay/web   # http://localhost:3000

# API のみ
npm run dev -w @nodestay/api
```

---

## テスト

### フロントエンド（Vitest）

```bash
# apps/web ディレクトリから実行
cd apps/web
npx vitest run

# カバレッジ付き（閾値 80%）
npx vitest run --coverage
```

### スマートコントラクト（Hardhat / Mocha）

```bash
cd packages/contracts

# 全テスト実行（61テスト）
npx hardhat test

# カバレッジ
npx hardhat coverage
```

### 全ワークスペース一括

```bash
npm test
npm run test:coverage
```

---

## スマートコントラクト

### コントラクト一覧

#### `AccessPassNFT.sol` — 利用権NFT（ERC-721）

ネットカフェの座席利用権をNFTとして発行・管理します。

| 関数 | 権限 | 概要 |
|---|---|---|
| `mint(to, planId, venueId, durationMinutes, expiresAt, transferable)` | Operator | 利用権NFT発行 |
| `consumePass(tokenId, usedMinutes)` | Operator | チェックアウト時に使用分を消費 |
| `suspendPass(tokenId)` | Operator | 不正対応：一時停止 |
| `reactivatePass(tokenId)` | Operator | 停止解除 |
| `isPassValid(tokenId)` | View | 有効性確認（isActive && 期限内 && 残分数 > 0） |
| `setOperator(address)` | Owner | オペレータ変更 |

**PassData 構造体**

```solidity
struct PassData {
    uint256 planId;           // 料金プランID
    uint256 venueId;          // 対象店舗ID（0 = 複数店舗共通）
    uint256 remainingMinutes; // 残り利用時間（分）
    uint256 expiresAt;        // 有効期限（UNIXタイムスタンプ）
    bool    isActive;         // 有効フラグ
    bool    transferable;     // 譲渡可能フラグ（月額プランは false）
}
```

**転送制限**
- `transferable = false` のパスは転送不可
- 転送後 **24時間のクールダウン**（マネーロンダリング防止）

---

#### `DepositVault.sol` — デポジット金庫

JPYC の hold / capture / release パターンを実装します。

| 関数 | 権限 | 概要 |
|---|---|---|
| `holdDeposit(amount)` | 誰でも | 自分の JPYC を Vault に預け入れ |
| `captureDeposit(payer, to, amount)` | Operator | 預け入れ済み残高を任意の宛先へ送金（チェックアウト精算） |
| `releaseDeposit(payer, amount)` | Operator | 預け入れ済み残高をユーザーへ返金 |

---

#### `ComputeMarket.sol` — 算力マーケット

ネットカフェの遊休PCをレンタルするためのオンチェーンマーケットです。
`bytes32 nodeId`（`keccak256(オフチェーンID)`）でノードをオンチェーン管理します。

**ノード管理（Operator）**

| 関数 | 概要 |
|---|---|
| `registerNode(nodeId, venueOwner, pricePerHourMinor, minHours, maxHours)` | ノード新規登録 |
| `updateNode(nodeId, price, minHours, maxHours)` | 料金・時間設定更新 |
| `deactivateNode(nodeId)` / `activateNode(nodeId)` | 受付停止 / 再開 |

**ジョブライフサイクル**

```
submitJob（JPYC エスクロー）
    ↓
assignJob（PENDING → ASSIGNED）
    ↓
startJob（ASSIGNED → RUNNING）
    ↓
completeJob  →  店舗 75% + プラットフォーム 25% 自動送金
failJob      →  全額返金（ASSIGNED / RUNNING から）
cancelJob    →  全額返金（PENDING / ASSIGNED から、依頼者またはオペレータのみ）
```

**収益分配**

| 受取先 | 割合 |
|---|---|
| 店舗（venueOwner） | 75%（`PLATFORM_FEE_BPS = 250 / FEE_DENOMINATOR = 1000`） |
| プラットフォーム | 25% |

---

### Polygon Amoy デプロイ済みアドレス

| コントラクト | アドレス |
|---|---|
| MockERC20（テスト用 JPYC） | `0x2fA62C3E53b67A9678F4Aac14E2843c1dF7b8AfD` |
| AccessPassNFT | `0x1cC076ed23D6c2e5dD37aAe28b9a21aA9d46eC3a` |
| DepositVault | `0xb2a5A4354F9b53089893b2aF9840a29cEeEe84fD` |
| ComputeMarket | `0x159E85E8f296B9a3A95A9FFaE59Ae7aF4358Ee77` |

> デプロイヤー / platformFeeRecipient: `0x71BB0f1EBa26c41Ef6703ec30A249Bb0F293d6c8`

---

### デプロイ方法

#### 1. 環境変数の設定

```bash
cd packages/contracts
cp .env.example .env
```

`.env` を編集して値を入力します。

```env
# デプロイヤー秘密鍵（0x プレフィックスなし）
DEPLOYER_PRIVATE_KEY=

# RPC エンドポイント（省略時はパブリックノードを使用）
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com

# Polygonscan API キー（検証する場合のみ）
POLYGONSCAN_API_KEY=

# プラットフォーム手数料受取アドレス（空の場合はデプロイヤーアドレスを使用）
PLATFORM_FEE_RECIPIENT=

# JPYC トークンアドレス
# Amoy: 空のままにすると MockERC20 を自動デプロイ
# Polygon mainnet: 0x431D5dfF03120AFA4bDf332c61A6e1766eF37BF6
JPYC_TOKEN_ADDRESS=
```

#### 2. Amoy テストネット用 MATIC 取得

[Polygon Faucet](https://faucet.polygon.technology/) にアクセスしてデプロイヤーアドレスへ MATIC を送金します。

#### 3. コントラクトのコンパイル

```bash
cd packages/contracts
npx hardhat compile
# → 26 ファイルコンパイル、74 TypeChain 型生成
```

#### 4. デプロイ実行

```bash
# Amoy テストネット
npx hardhat run scripts/deploy.ts --network amoy

# Polygon メインネット
npx hardhat run scripts/deploy.ts --network polygon

# ローカル（Hardhat Network）
npx hardhat run scripts/deploy.ts
```

デプロイが完了すると以下のような出力が表示されます。

```
====================================
デプロイ完了 🎉
====================================
ネットワーク          : amoy
JPYC トークン         : 0x...
AccessPassNFT         : 0x...
DepositVault          : 0x...
ComputeMarket         : 0x...
platformFeeRecipient  : 0x...
====================================
```

#### 5. Polygonscan でのコントラクト検証（任意）

```bash
# .env に POLYGONSCAN_API_KEY を設定してから再デプロイすると自動で検証されます
# 手動検証の場合
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS...>
```

---

### コントラクトテスト詳細

```bash
cd packages/contracts
npx hardhat test
```

```
AccessPassNFT （24テスト）
  setOperator: 3 テスト
  mint:        5 テスト
  consumePass: 5 テスト
  suspend / reactivate: 1 テスト
  isPassValid: 4 テスト
  転送制限（クールダウン・譲渡不可）: 4 テスト
  getPass: 1 テスト

ComputeMarket （37テスト）
  constructor / 管理関数: 7 テスト
  registerNode / updateNode / deactivate: 11 テスト
  ジョブライフサイクル（正常系）: 2 テスト
  failJob / cancelJob: 7 テスト
  エラーケース: 10 テスト

DepositVault: 3 テスト
MockERC20Config: 1 テスト

合計: 61 テスト
```

---

## フロントエンド画面構成

| パス | 画面 | 概要 |
|---|---|---|
| `/` | ホーム | Hero・機能紹介・使い方・料金ハイライト・収益シミュレーション |
| `/venues` | 店舗一覧 | 検索・フィルタ・スケルトンローディング |
| `/venues/[venueId]` | 店舗詳細 | プランカード・JPYC購入モーダル |
| `/passes` | マイパス | フィルタタブ・QRコードモーダル・残時間プログレスバー |
| `/sessions` | セッション | リアルタイムタイマー（1秒更新）・超過料金計算・チェックアウト |
| `/compute` | 算力マーケット | ノードカード・ジョブ依頼モーダル・マイジョブ・収益ダッシュボード |
| `/merchant/compute` | 店舗向けノード管理 | ノード有効化・料金設定・収益シミュレーター・導入ガイド |

**カラーパレット**

| 用途 | 色 |
|---|---|
| ブランド（インディゴ） | `#6366F1`（`--color-brand-500`） |
| JPYC（ゴールド） | `#F59E0B`（`--color-jpyc-500`） |
| ダーク背景 | `#0F172A`（`--color-surface-900`） |

---

## ライセンス

MIT
