# Node Stay（プロジェクト骨格）

本リポジトリは `nodestay-prd.md` に基づく実装の“最小の出発点”です。フロントとサービス層（API/ドメイン/クライアント）とコントラクトを分離し、テストとカバレッジ計測を最初からワークスペース単位で回せる構成にしています。

## 構成（理由つき）

- `apps/web`：Next.js（UI）。**表示・状態管理・画面遷移**に責務を限定（ビジネスルールは持たない）
- `apps/api`：NestJS（サービス層）。**冪等、台帳（オフチェーン）、規制プロフィール、本人確認/証跡**の中心
- `packages/domain`：共有ドメイン（型/Zodスキーマ）。**UI/API間のズレを防ぐ**ために単一の定義源にする
- `packages/api-client`：WebからAPIを呼ぶクライアント。**Idempotency-Key を含む契約**を一箇所に集約する
- `packages/contracts`：Hardhat（Solidity）。**デポジット hold/capture/release**等、PRDの決済要件をオンチェーンで表現

> 最適化ポイント：UIからAPIへ直接 “生のfetch” を散らさず、`api-client` に寄せることで、冪等キーやエラー整形を一貫させます（PRDの「決済系API共通規約（冪等）」に整合）。

## 前提

- WSL（Ubuntu）環境で実行（Windows PowerShell の npm 実行制限を回避）
- Node.js 20+ / npm

## セットアップ

```bash
cd /home/whx1230004/NodeStay
npm install
```

## 開発

```bash
# APIとWebを同時起動
npm run dev
```

## テスト（全ワークスペース）

```bash
npm test
npm run test:coverage
```

